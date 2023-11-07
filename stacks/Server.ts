import * as sst from 'sst/constructs';
import { Config } from './Config';
import {
    AmazonLinuxCpuType,
    AmazonLinuxEdition,
    AmazonLinuxGeneration,
    AmazonLinuxImage,
    AmazonLinuxKernel,
    AmazonLinuxVirt,
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    Peer,
    Port,
    SecurityGroup,
    UserData,
    Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export const Server = ({ stack }: sst.StackContext) => {
    const { SERVER_PORT, SERVER_SSH_KEY_NAME, REPOSITORY_DEPLOY_KEY, REPOSITORY_SSH_ADDRESS } =
        sst.use(Config);

    const vpc = Vpc.fromLookup(stack, `ServerVpc`, { isDefault: true });

    const securityGroup = new SecurityGroup(stack, `ServerSecurityGroup`, {
        vpc,
        allowAllIpv6Outbound: true,
        allowAllOutbound: true,
    });

    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(SERVER_PORT), 'Main server port IPV4');
    securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(SERVER_PORT), 'Main server port IPV6');
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'SSH port IPV4');
    securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(22), 'SSH port IPV6');

    const role = new Role(stack, 'ServerRole', {
        assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    const userData = UserData.forLinux();
    userData.addCommands(
        ...[
            /**
             * Install dependencies
             */
            'sudo yum install -y java-17-amazon-corretto',
            'sudo yum install -y git',

            /**
             * Setup Repository
             */
            'touch /home/ec2-user/.ssh/config',
            'echo "Host github.com" > /home/ec2-user/.ssh/config',
            'echo -e "\tHostname github.com" >> /home/ec2-user/.ssh/config',
            'echo -e "\tIdentityFile /home/ec2-user/.ssh/deploy_key.pem" >> /home/ec2-user/.ssh/config',
            'echo -e "\tStrictHostKeyChecking no" >> /home/ec2-user/.ssh/config',
            `echo -e "${REPOSITORY_DEPLOY_KEY}" > /home/ec2-user/.ssh/deploy_key.pem`,
            'chmod 600 /home/ec2-user/.ssh/config',
            'chmod 600 /home/ec2-user/.ssh/deploy_key.pem',
            'sudo chown ec2-user:ec2-user /home/ec2-user/.ssh/config',
            'sudo chown ec2-user:ec2-user /home/ec2-user/.ssh/deploy_key.pem',
            `git clone ${REPOSITORY_SSH_ADDRESS} /home/ec2-user/repo`,
            'sudo chown -R ec2-user:ec2-user /home/ec2-user/repo',

            /**
             * Setup startup service
             */
            'echo -e "[Unit]" > /etc/systemd/system/mcsrv.service',
            'echo -e "Description=Server service" >> /etc/systemd/system/mcsrv.service',
            'echo -e "After=network.target\n" >> /etc/systemd/system/mcsrv.service',
            'echo -e "[Service]" >> /etc/systemd/system/mcsrv.service',
            'echo -e "Type=simple" >> /etc/systemd/system/mcsrv.service',
            'echo -e "Restart=always" >> /etc/systemd/system/mcsrv.service',
            'echo -e "RestartSec=3" >> /etc/systemd/system/mcsrv.service',
            'echo -e "User=ec2-user" >> /etc/systemd/system/mcsrv.service',
            `echo -e 'Environment="SERVER_MEMORY=1024M"' >> /etc/systemd/system/mcsrv.service`,
            'echo -e "ExecStart=/home/ec2-user/repo/packages/server/scripts/start.sh\n" >> /etc/systemd/system/mcsrv.service',
            'echo -e "[Install]" >> /etc/systemd/system/mcsrv.service',
            'echo -e "WantedBy=multi-user.target" >> /etc/systemd/system/mcsrv.service',
            'sudo systemctl enable mcsrv --now',

            /**
             * Setup sync service cron job
             */
            'echo "*/5 * * * * ec2-user /home/ec2-user/repo/packages/server/scripts/sync.sh" >> /var/spool/cron/ec2-user',
        ],
    );

    const instance = new Instance(stack, 'ServerInstance', {
        vpc,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
        machineImage: new AmazonLinuxImage({
            edition: AmazonLinuxEdition.STANDARD,
            generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: AmazonLinuxCpuType.X86_64,
            virtualization: AmazonLinuxVirt.HVM,
            kernel: AmazonLinuxKernel.KERNEL5_X,
        }),
        securityGroup,
        role,
        userData,
        keyName: SERVER_SSH_KEY_NAME,
    });

    return {
        instance,
    };
};
