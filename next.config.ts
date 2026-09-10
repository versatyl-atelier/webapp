import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const lanIps = Object.values(networkInterfaces())
  .flat()
  .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
  .map((iface) => iface!.address);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: import.meta.dirname,
  },
  allowedDevOrigins: lanIps,
};

export default nextConfig;
