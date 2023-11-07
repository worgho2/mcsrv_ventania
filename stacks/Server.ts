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
    const { SERVER_PORT, SERVER_SSH_KEY_NAME } = sst.use(Config);

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
    userData.addCommands(...['']);

    const instance = new Instance(stack, 'ServerInstance', {
        vpc,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
        machineImage: new AmazonLinuxImage({
            edition: AmazonLinuxEdition.STANDARD,
            generation: AmazonLinuxGeneration.AMAZON_LINUX_2023,
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
