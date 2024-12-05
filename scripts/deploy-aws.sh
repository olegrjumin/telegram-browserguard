#!/bin/bash
# deploy.sh

set -e

AWS_REGION="eu-north-1"
INSTANCE_NAME="screenshot-api"
KEY_NAME="screenshot-api-key"
INSTANCE_TYPE="t3.micro"
SECURITY_GROUP_NAME="screenshot-api-sg"
YOUR_IP=""
APP_PORT=3000
AMI_USERNAME="ec2-user"
AMI_X86="ami-0416c18e75bd69567"  # AL2023 x86
AMI_ARM="ami-01ddec32b992af40d"  # AL2023 ARM

# Create state directory
mkdir -p .aws-state

check_security_group() {
    local SG_ID=$(aws ec2 describe-security-groups \
        --region $AWS_REGION \
        --filters Name=group-name,Values=$SECURITY_GROUP_NAME \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
    
    if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
        echo "none"
    else
        echo "$SG_ID"
    fi
}

setup_security_group() {
    local RAW_SG_ID=$(check_security_group)
    
    if [ "$RAW_SG_ID" = "none" ]; then
        echo "Creating new security group..." >&2
        
        local VPC_ID=$(aws ec2 describe-vpcs \
            --region $AWS_REGION \
            --filters "Name=isDefault,Values=true" \
            --query 'Vpcs[0].VpcId' \
            --output text)
            
        if [ -z "$VPC_ID" ]; then
            echo "Error: No default VPC found" >&2
            exit 1
        fi
        
        local NEW_SG_ID=$(aws ec2 create-security-group \
            --region $AWS_REGION \
            --group-name $SECURITY_GROUP_NAME \
            --description "Security group for Screenshot API" \
            --vpc-id $VPC_ID \
            --query 'GroupId' \
            --output text)

        if [ -z "$NEW_SG_ID" ]; then
            echo "Error: Failed to create security group" >&2
            exit 1
        fi

        sleep 5

        aws ec2 authorize-security-group-ingress \
            --region $AWS_REGION \
            --group-id "$NEW_SG_ID" \
            --protocol tcp \
            --port 22 \
            --cidr $YOUR_IP/32 >/dev/null 2>&1

        aws ec2 authorize-security-group-ingress \
            --region $AWS_REGION \
            --group-id "$NEW_SG_ID" \
            --protocol tcp \
            --port $APP_PORT \
            --cidr 0.0.0.0/0 >/dev/null 2>&1

        echo "$NEW_SG_ID"
    else
        # Update existing security group rules
        echo "Updating existing security group rules..." >&2
        
        # Remove existing SSH rules using describe-security-group-rules
        aws ec2 describe-security-group-rules \
            --region $AWS_REGION \
            --filters "Name=group-id,Values=$RAW_SG_ID" \
            --query "SecurityGroupRules[?FromPort==\`22\`].SecurityGroupRuleId" \
            --output text | while read -r rule; do
            if [ -n "$rule" ]; then
                echo "Removing rule: $rule" >&2
                aws ec2 revoke-security-group-rules \
                    --region $AWS_REGION \
                    --group-id "$RAW_SG_ID" \
                    --security-group-rule-ids "$rule" >/dev/null 2>&1 || true
            fi
        done

        # Add new SSH rule with current IP
        echo "Adding new SSH rule for IP: $YOUR_IP" >&2
        aws ec2 authorize-security-group-ingress \
            --region $AWS_REGION \
            --group-id "$RAW_SG_ID" \
            --protocol tcp \
            --port 22 \
            --cidr $YOUR_IP/32 >/dev/null 2>&1

        # Verify the rule was added
        aws ec2 describe-security-group-rules \
            --region $AWS_REGION \
            --filters "Name=group-id,Values=$RAW_SG_ID" \
            --query "SecurityGroupRules[?FromPort==\`22\`].CidrIpv4" \
            --output text | grep -q "$YOUR_IP/32" || {
                echo "Error: Failed to add SSH rule" >&2
                exit 1
            }

        echo "$RAW_SG_ID"
    fi
}

setup_key_pair() {
    if [ ! -f ".aws-state/$KEY_NAME.pem" ]; then
        echo "Creating new key pair..."
        aws ec2 delete-key-pair --region $AWS_REGION --key-name $KEY_NAME 2>/dev/null || true
        aws ec2 create-key-pair \
            --region $AWS_REGION \
            --key-name $KEY_NAME \
            --query 'KeyMaterial' \
            --output text > ".aws-state/$KEY_NAME.pem"
        chmod 400 ".aws-state/$KEY_NAME.pem"
    else
        echo "Using existing key pair: $KEY_NAME"
    fi
}

terminate_existing_instance() {
    echo "Checking for existing instances..."
    local INSTANCES=$(aws ec2 describe-instances \
        --region $AWS_REGION \
        --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
        --query 'Reservations[*].Instances[*].InstanceId' \
        --output text)
    
    if [ -n "$INSTANCES" ] && [ "$INSTANCES" != "None" ]; then
        echo "Found existing instances. Terminating..."
        for INSTANCE_ID in $INSTANCES; do
            echo "Terminating instance: $INSTANCE_ID"
            aws ec2 terminate-instances --region $AWS_REGION --instance-ids "$INSTANCE_ID"
        done
        
        echo "Waiting for instances to terminate..."
        for INSTANCE_ID in $INSTANCES; do
            aws ec2 wait instance-terminated \
                --region $AWS_REGION \
                --instance-ids "$INSTANCE_ID"
        done
        echo "All existing instances terminated"
    else
        echo "No existing instances found"
    fi
}

check_instance_health() {
    local INSTANCE_ID="$1"
    local MAX_ATTEMPTS=30
    local ATTEMPT=1

    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        echo "Checking instance health (attempt $ATTEMPT/$MAX_ATTEMPTS)..." >&2
        
        # Get instance public IP
        local PUBLIC_IP=$(aws ec2 describe-instances \
            --region $AWS_REGION \
            --instance-ids "$INSTANCE_ID" \
            --query 'Reservations[0].Instances[0].PublicIpAddress' \
            --output text)

        echo "Instance public IP: $PUBLIC_IP" >&2
        
        # Check system status and instance status separately
        local SYSTEM_STATUS=$(aws ec2 describe-instance-status \
            --region $AWS_REGION \
            --instance-ids "$INSTANCE_ID" \
            --query 'InstanceStatuses[0].SystemStatus.Status' \
            --output text)
        
        local INSTANCE_STATUS=$(aws ec2 describe-instance-status \
            --region $AWS_REGION \
            --instance-ids "$INSTANCE_ID" \
            --query 'InstanceStatuses[0].InstanceStatus.Status' \
            --output text)
        
        echo "System Status: $SYSTEM_STATUS, Instance Status: $INSTANCE_STATUS" >&2
        
        if [ "$SYSTEM_STATUS" = "impaired" ] || [ "$INSTANCE_STATUS" = "impaired" ]; then
            echo "Instance is impaired, attempting recovery..." >&2
            # Stop and start the instance to recover it
            aws ec2 stop-instances --region $AWS_REGION --instance-ids "$INSTANCE_ID" >&2
            aws ec2 wait instance-stopped --region $AWS_REGION --instance-ids "$INSTANCE_ID" >&2
            aws ec2 start-instances --region $AWS_REGION --instance-ids "$INSTANCE_ID" >&2
            aws ec2 wait instance-running --region $AWS_REGION --instance-ids "$INSTANCE_ID" >&2
            sleep 30  # Wait for status checks to initialize
            ATTEMPT=$((ATTEMPT + 1))
            continue
        fi

        if [ "$SYSTEM_STATUS" = "ok" ] && [ "$INSTANCE_STATUS" = "ok" ]; then
            local DNS=$(get_instance_dns "$INSTANCE_ID")
            echo "Status checks passed, testing SSH connectivity to $DNS (IP: $PUBLIC_IP)..." >&2
            
            # Test TCP connection first
            if nc -zv "$PUBLIC_IP" 22 2>&1 | grep -q "succeeded"; then
                echo "TCP connection to port 22 successful, attempting SSH..." >&2
                # Try SSH with detailed debugging
                if ssh -v -i ".aws-state/$KEY_NAME.pem" \
                    -o StrictHostKeyChecking=no \
                    -o ConnectTimeout=10 \
                    -o BatchMode=yes \
                    -o UserKnownHostsFile=/dev/null \
                    ${AMI_USERNAME}@"$PUBLIC_IP" 'echo "SSH Success"' >&2; then
                    echo "healthy"
                    return
                else
                    echo "SSH connection failed, debug output:" >&2
                    ssh -v -i ".aws-state/$KEY_NAME.pem" \
                        -o StrictHostKeyChecking=no \
                        -o ConnectTimeout=10 \
                        -o BatchMode=yes \
                        -o UserKnownHostsFile=/dev/null \
                        ${AMI_USERNAME}@"$PUBLIC_IP" 'echo "test"' >&2 || true
                fi
            else
                echo "TCP connection to port 22 failed" >&2
            fi
        fi
        
        sleep 20
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    echo "timeout"
}

create_instance() {
    local SG_ID="$1"
    
    # Detect if instance type is ARM-based
    if [[ "$INSTANCE_TYPE" =~ ^[a-z][0-9]g\. || "$INSTANCE_TYPE" =~ ^t4g\. ]]; then
        local AMI_ID="$AMI_ARM"
        echo "Using ARM architecture AMI: $AMI_ID" >&2
    else
        local AMI_ID="$AMI_X86"
        echo "Using x86 architecture AMI: $AMI_ID" >&2
    fi

    # Validate security group ID format
    if [[ ! "$SG_ID" =~ ^sg-[a-f0-9]+$ ]]; then
        echo "Error: Invalid security group ID format: '$SG_ID'" >&2
        exit 1
    fi

    echo "Creating new EC2 instance with AMI: $AMI_ID..." >&2
    
    # User data script to ensure SSH is properly configured
    local USER_DATA=$(cat <<'EOF'
#!/bin/bash
apt-get update
apt-get install -y openssh-server
systemctl enable ssh
systemctl start ssh
EOF
)

    local INSTANCE_ID=$(aws ec2 run-instances \
        --region $AWS_REGION \
        --image-id "$AMI_ID" \
        --instance-type $INSTANCE_TYPE \
        --key-name $KEY_NAME \
        --security-group-ids "$SG_ID" \
        --user-data "$USER_DATA" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
        --query 'Instances[0].InstanceId' \
        --output text)

    if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
        echo "Error: Failed to create instance" >&2
        exit 1
    fi

    echo "Waiting for instance to be running..." >&2
    aws ec2 wait instance-running \
        --region $AWS_REGION \
        --instance-ids "$INSTANCE_ID"

    echo "Instance is running, waiting for status checks..." >&2
    local HEALTH=$(check_instance_health "$INSTANCE_ID")
    
    if [ "$HEALTH" != "healthy" ]; then
        echo "Error: Instance failed to become healthy (status: $HEALTH)" >&2
        aws ec2 terminate-instances --region $AWS_REGION --instance-ids "$INSTANCE_ID" >/dev/null
        exit 1
    fi
    
    echo "Instance is ready and healthy: $INSTANCE_ID" >&2
    echo "$INSTANCE_ID"
}

get_instance_dns() {
    local INSTANCE_ID="$1"
    aws ec2 describe-instances \
        --region $AWS_REGION \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].PublicDnsName' \
        --output text
}

verify_instance() {
    local INSTANCE_ID="$1"
    
    # Get current DNS and verify it matches saved DNS
    local CURRENT_DNS=$(get_instance_dns "$INSTANCE_ID")
    local SAVED_DNS=""
    [ -f ".aws-state/instance-dns" ] && SAVED_DNS=$(cat ".aws-state/instance-dns")
    
    if [ "$CURRENT_DNS" != "$SAVED_DNS" ]; then
        echo "Warning: Instance DNS has changed from $SAVED_DNS to $CURRENT_DNS" >&2
        echo "$CURRENT_DNS" > .aws-state/instance-dns
    fi
    
    local HEALTH=$(check_instance_health "$INSTANCE_ID")
    
    if [ "$HEALTH" != "healthy" ]; then
        echo "Error: Instance $INSTANCE_ID is not healthy (status: $HEALTH)" >&2
        echo "Terminating unhealthy instance..." >&2
        aws ec2 terminate-instances --region $AWS_REGION --instance-ids "$INSTANCE_ID" >/dev/null
        exit 1
    fi
    
    # Verify security group
    local INSTANCE_SG=$(aws ec2 describe-instances \
        --region $AWS_REGION \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
        --output text)
    
    if [ "$INSTANCE_SG" != "$SG_ID" ]; then
        echo "Warning: Instance security group ($INSTANCE_SG) differs from expected ($SG_ID)" >&2
    fi
}


deploy_application() {
    local INSTANCE_DNS="$1"
    local INSTANCE_ID="$2"
    local KEY_PATH="$PWD/.aws-state/$KEY_NAME.pem"
    local MAX_RETRIES=5
    local RETRY=0

    # Verify key file exists and has correct permissions
    if [ ! -f "$KEY_PATH" ]; then
        echo "Error: SSH key file not found at $KEY_PATH" >&2
        exit 1
    fi

    if [ "$(stat -f "%Lp" "$KEY_PATH")" != "400" ]; then
        echo "Fixing SSH key permissions..." >&2
        chmod 400 "$KEY_PATH"
    fi

    echo "Deploying application to $INSTANCE_DNS (Instance ID: $INSTANCE_ID)..."
    echo "Using SSH key: $KEY_PATH"
    
    # Verify instance is running
    verify_instance "$INSTANCE_ID"
    
    echo "Waiting for SSH to be available..."
    local SSH_OPTS="-i $KEY_PATH -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes -o UserKnownHostsFile=/dev/null"
    
    # Add reboot logic before SSH attempts
    echo "Rebooting instance to ensure SSH service is running properly..."
    aws ec2 reboot-instances --region $AWS_REGION --instance-ids "$INSTANCE_ID"
    
    echo "Waiting 60 seconds for instance to reboot..."
    sleep 60

    # SSH connection attempts
    while [ $RETRY -lt $MAX_RETRIES ]; do
        echo "Attempting SSH connection (attempt $((RETRY + 1))/$MAX_RETRIES)..."
        if ssh -o ConnectTimeout=10 $SSH_OPTS ${AMI_USERNAME}@$INSTANCE_DNS 'echo "SSH test successful"' >&2; then
            break
        fi
        
        RETRY=$((RETRY + 1))
        if [ $RETRY -lt $MAX_RETRIES ]; then
            if [ $RETRY -eq 2 ]; then
                echo "Multiple SSH failures. Rebooting instance again..."
                aws ec2 reboot-instances --region $AWS_REGION --instance-ids "$INSTANCE_ID"
                sleep 60
            else
                echo "SSH connection failed, waiting 30 seconds before retry..."
                sleep 30
            fi
        fi
    done

    if [ $RETRY -eq $MAX_RETRIES ]; then
        echo "Error: Failed to establish SSH connection after $MAX_RETRIES attempts" >&2
        exit 1
    fi

    echo "SSH connection established, deploying files..."
    
    # Create the app directory structure
    ssh $SSH_OPTS ${AMI_USERNAME}@$INSTANCE_DNS 'mkdir -p ~/app/src'
    
    # Copy all necessary files
    scp $SSH_OPTS \
        package.json \
        Dockerfile \
        ${AMI_USERNAME}@$INSTANCE_DNS:~/app/

    # Copy the entire src directory
    scp $SSH_OPTS \
        -r ./src/* \
        ${AMI_USERNAME}@$INSTANCE_DNS:~/app/src/

    # Setup and run the application
    ssh $SSH_OPTS ${AMI_USERNAME}@$INSTANCE_DNS '
        cd ~/app
        
        echo "Installing Docker..."
        if ! command -v docker &> /dev/null; then
            sudo dnf update -y
            sudo dnf install -y docker
            sudo systemctl start docker
            sudo usermod -a -G docker $USER
        fi

        sudo systemctl status docker >/dev/null 2>&1 || sudo systemctl start docker

        # Remove existing container and image
        echo "Cleaning up existing Docker resources..."
        sudo docker rm -f screenshot-api 2>/dev/null || true
        sudo docker rmi -f screenshot-api 2>/dev/null || true

        echo "Building Docker image..."
        # Build with error handling
        if ! sudo docker build --no-cache -t screenshot-api .; then
            echo "Docker build failed"
            exit 1
        fi
        
        echo "Starting container..."
        if ! sudo docker run -d --name screenshot-api \
            -p 3000:3000 \
            --restart unless-stopped \
            screenshot-api; then
            echo "Failed to start container"
            exit 1
        fi
            
        echo "Waiting for container to start..."
        sleep 10
        
        # Check container status
        if ! sudo docker ps | grep -q screenshot-api; then
            echo "Error: Container failed to start"
            sudo docker logs screenshot-api
            exit 1
        fi
        
        # Add container health check
        echo "Checking application health..."
        for i in {1..6}; do
            if curl -s http://localhost:3000/health >/dev/null; then
                echo "Application is healthy!"
                break
            fi
            if [ $i -eq 6 ]; then
                echo "Error: Application health check failed"
                sudo docker logs screenshot-api
                exit 1
            fi
            echo "Waiting for application to become healthy... (attempt $i/6)"
            sleep 10
        done
        
        echo "Container started successfully"
    '
}

main() {
    echo "Starting deployment..."
    
    # Setup security group
    SG_ID=$(setup_security_group)
    if [[ ! "$SG_ID" =~ ^sg-[a-f0-9]+$ ]]; then
        echo "Error: Invalid security group ID returned: '$SG_ID'"
        exit 1
    fi
    echo "Using security group ID: $SG_ID"
    
    # Setup key pair
    setup_key_pair
    
    # Create or reuse instance
    INSTANCE_ID=$(create_instance "$SG_ID")
    
    if [[ ! "$INSTANCE_ID" =~ ^i-[a-f0-9]+$ ]]; then
        echo "Error: Invalid instance ID returned: '$INSTANCE_ID'" >&2
        exit 1
    fi
    
    echo "Using instance: $INSTANCE_ID" >&2
    
    # Get instance DNS
    INSTANCE_DNS=$(get_instance_dns "$INSTANCE_ID")
    
    if [ -z "$INSTANCE_DNS" ] || [ "$INSTANCE_DNS" = "None" ]; then
        echo "Error: Could not get instance DNS" >&2
        exit 1
    fi
    
    echo "Instance DNS: $INSTANCE_DNS"
    
    # Save instance details
    echo "$INSTANCE_ID" > .aws-state/instance-id
    echo "$INSTANCE_DNS" > .aws-state/instance-dns
    
    # Deploy application
    deploy_application "$INSTANCE_DNS" "$INSTANCE_ID"
    
    echo "Deployment complete! Application is running at http://$INSTANCE_DNS:$APP_PORT"
    echo "You can check the logs using: ./logs.sh"
}

main