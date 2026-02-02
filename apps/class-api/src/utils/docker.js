// utils/docker.js
import Docker from "dockerode";

// detect docker host from env or fallback to socket
const opts = {};
if (process.env.DOCKER_HOST) {
  // naively parse tcp://host:port or host:port
  const u = new URL(process.env.DOCKER_HOST);
  opts.host = u.hostname;
  opts.port = u.port || 2375;
  opts.protocol = u.protocol.replace(":", "");
} else {
  opts.socketPath =
    process.platform === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock";
}

export const docker = new Docker(opts);
