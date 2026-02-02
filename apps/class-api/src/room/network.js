// room/network.js
import { docker } from "../utils/docker.js"; 
import { TRAEFIK_NAME } from "../config.js";

export async function createNetwork(classId) {
  const networkName = `classnet-${classId}`;
  try {
    await docker.createNetwork({ Name: networkName, Driver: "bridge" });
    console.log(`✅ Network ${networkName} created`);
  } catch (err) {
    if (err?.statusCode === 409) {
      console.log(`ℹ️ Network ${networkName} đã tồn tại`);
    } else {
      throw err;
    }
  }
  return networkName;
}

export async function connectNetworkToTraefik(networkName, traefikName = TRAEFIK_NAME) {
  const n = docker.getNetwork(networkName);
  const t = docker.getContainer(traefikName);

  const tInfo = await t.inspect();
  const attached = Object.prototype.hasOwnProperty.call(
    tInfo.NetworkSettings.Networks || {},
    networkName
  );

  if (!attached) {
    await n.connect({ Container: traefikName });
    console.log(`🔌 Attached ${networkName} -> ${traefikName}`);
  } else {
    console.log(`ℹ️ ${traefikName} đã gắn ${networkName}`);
  }
}

export async function getContainerIP(containerName, networkName) {
  const inspect = await docker.getContainer(containerName).inspect();
  return inspect.NetworkSettings.Networks?.[networkName]?.IPAddress || null;
}
