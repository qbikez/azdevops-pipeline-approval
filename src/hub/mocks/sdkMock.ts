import * as config from "./_local.config.json";
import * as realSDK from "azure-devops-extension-sdk";
import * as API from "azure-devops-extension-api";

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
};

export function getClient<T>(
  clientClass: API.RestClientFactory<T>,
  clientOptions?: API.IVssRestClientOptions
): T {
  if (!useMocks) return API.getClient(clientClass, clientOptions);
  const defaults = {
    rootPath: `https://vsrm.dev.azure.com/${config.organization}/`,
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
