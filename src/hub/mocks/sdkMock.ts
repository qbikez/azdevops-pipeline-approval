import * as config from "./_local.config.json";
import * as realSDK from "azure-devops-extension-sdk";
import * as API from "azure-devops-extension-api";
import { ReleaseRestClient } from "azure-devops-extension-api/Release";

let useMocks = false;

export function init(options: { mock: boolean }) {
  useMocks = options.mock;
}

export const SDK = {
  init: () => {
    if (!useMocks) return realSDK.init();
  },
  getService: async <TService>(
    serviceId: API.CommonServiceIds
  ): Promise<TService> => {
    if (!useMocks) return realSDK.getService<TService>(serviceId);
    switch (serviceId) {
      case API.CommonServiceIds.ProjectPageService:
        const svc: API.IProjectPageService = {
          getProject: async () => {
            const project: API.IProjectInfo = {
              id: "mock-project-id",
              name: `${config.projectName}`,
            };
            return project;
          },
        };
        return (svc as unknown) as TService;
    }
    return ({} as unknown) as TService;
  },
  getUser: (): realSDK.IUserContext => {
    if (!useMocks) return realSDK.getUser();
    return {
      descriptor: "",
      displayName: "mock-user",
      id: config.userId,
      imageUrl: "http://example.org",
      name: "mock-user-name",
    };
  },
  getHost: (): realSDK.IHostContext => {
    if (!useMocks) return realSDK.getHost();
    return {
      id: "host-id",
      name: config.organization,
      serviceVersion: "0.0.0",
      type: realSDK.HostType.Organization,
    };
  },
};

export function getClient<T>(
  clientClass: API.RestClientFactory<T>,
  clientOptions?: API.IVssRestClientOptions
): T {
  if (!useMocks) return API.getClient(clientClass, clientOptions);
  let rootPath = `https://dev.azure.com/${config.organization}/`;
  if ((clientClass as unknown) === ReleaseRestClient) {
    rootPath = `https://vsrm.dev.azure.com/${config.organization}/`;
  }
  const defaults = {
    rootPath,
    authTokenProvider: {
      getAuthorizationHeader: async (forceRefresh?: boolean) => {
        return config.authHeader;
      },
    },
  };
  return API.getClient(clientClass, {
    ...defaults,
    ...(clientOptions || {}),
  });
}
