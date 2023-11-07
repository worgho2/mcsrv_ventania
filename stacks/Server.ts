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
            'sudo yum install -y java-17-amazon-corretto',
            'sudo yum install -y git',
            'touch ~/.ssh/config',
            'sudo chmod 600 ~/.ssh/config',
            'echo "Host github.com" > ~/.ssh/config',
            'echo -e "\tHostname github.com" >> ~/.ssh/config',
            'echo -e "\tIdentityFile ~/.ssh/deploy_key.pem" >> ~/.ssh/config',
            'echo -e "\tStrictHostKeyChecking no" >> ~/.ssh/config',
            `echo -e "${REPOSITORY_DEPLOY_KEY}" > ~/.ssh/deploy_key.pem`,
            'sudo chmod 600 ~/.ssh/deploy_key.pem',
            `git clone ${REPOSITORY_SSH_ADDRESS} repo`,
            'sudo echo "[Unit]" > /lib/systemd/system/server.service',
            'sudo echo -e "Description=Server\n" >> /lib/systemd/system/server.service',
            'sudo echo -e "ExecStart=SERVER_MEMORY=1024M ~/repo/packages/server/scripts/start.sh\n" >> /lib/systemd/system/server.service',
            'sudo echo "[Install]" >> /lib/systemd/system/server.service',
            'sudo echo -e "WantedBy=multi-user.target" >> /lib/systemd/system/server.service',
            'systemctl enable server.service --now',
            // TODO: Add cron job to backup the server periodically
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
