export interface InstallationStatus {
  installed: boolean;
  installationId?: number;
}

export interface GitHubAppCallbackParams {
  installation_id?: string;
  setup_action?: "install" | "update" | "request";
}
