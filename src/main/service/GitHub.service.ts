import { GitHubRelease } from "@/types/GitHub.types";
import { globalConfig } from "../../config/Global.config";

export const getLatestRelease = async (): Promise<GitHubRelease> => {
  const res = await fetch(`${globalConfig.repositoryApiUrl}/releases/latest`);
  if (!res.ok) throw new Error("Failed to fetch latest release");

  const data = (await res.json()) as GitHubRelease;
  return data;
};