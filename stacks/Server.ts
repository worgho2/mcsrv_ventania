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
    const { SERVER_SSH_KEY_NAME, GITHUB_URL, GITHUB_PAT_URL } = sst.use(Config);

    const vpc = Vpc.fromLookup(stack, `ServerVpc`, { isDefault: true });

    const securityGroup = new SecurityGroup(stack, `ServerSecurityGroup`, {
        vpc,
        allowAllIpv6Outbound: true,
        allowAllOutbound: true,
    });

    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(25565), 'MCSRV server port IPV4');
    securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(25565), 'MCSRV server port IPV6');
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'SSH port IPV4');
    securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(22), 'SSH port IPV6');

    const role = new Role(stack, 'ServerRole', {
        assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    const repositoryPath = '/home/ec2-user/repo';

    const userData = UserData.forLinux();

    /**
     * Install dependencies
     */
    userData.addCommands(
        ...[
            'sudo yum update -y',
            'sudo yum install -y java-17-amazon-corretto',
            'sudo yum install -y git',
        ],
    );

    /**
     * Setup repository
     */
    userData.addCommands(
        ...[
            `git config --global url."${GITHUB_PAT_URL}".insteadOf ${GITHUB_URL}`,
            `git clone ${GITHUB_URL} ${repositoryPath}`,
            `chown -R ec2-user:ec2-user ${repositoryPath}`,
        ],
    );

    /**
     * Setup mcsrv systemd service
     */
    userData.addCommands(
        ...[
            'cat << EOF > /etc/systemd/system/mcsrv.service',
            '[Unit]',
            'Description=MCSRV Service',
            'After=network.target',
            '',
            '[Service]',
            'Type=simple',
            'Restart=always',
            'RestartSec=3',
            'User=ec2-user',
            `ExecStart=${repositoryPath}/packages/scripts/start-server.sh`,
            '',
            '[Install]',
            'WantedBy=multi-user.target',
            'EOF',
            'sudo systemctl enable mcsrv --now',
        ],
    );

    /**
     * Setup cron jobs
     */
    userData.addCommands(
        ...[
            `echo "@reboot ec2-user ${repositoryPath}/packages/scripts/on-reboot.sh" | sudo tee -a /etc/cron.d/mcsrv-on-reboot`,
            `echo "*/10 * * * * ec2-user ${repositoryPath}/packages/scripts/sync-server-data.sh" | sudo tee -a /etc/cron.d/mcsrv-sync-server-data`,
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
