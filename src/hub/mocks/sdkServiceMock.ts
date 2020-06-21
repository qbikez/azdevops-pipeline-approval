import * as SDK from "azure-devops-extension-sdk";
import * as XDM from "azure-devops-extension-sdk/XDM";
import {
  CommonServiceIds,
  IProjectPageService,
  IProjectInfo,
} from "azure-devops-extension-api";

interface HandshakeResponse {
  initialConfig: any;
  contributionId: string;
  context: {
    user: SDK.IUserContext;
    host: SDK.IHostContext;
    extension: SDK.IExtensionContext;
  };
}

export function init() {
  const chan = XDM.channelManager.addChannel(window.parent, window.origin);
  chan.getObjectRegistry().register("DevOps.HostControl", (ctx) => {
    console.log("DevOps.HostControl factory");
    console.dir(ctx);
    return {
      initialHandshake: (msg: any) => {
        console.log("initialHandshake");
        console.dir(msg);
        const resp: HandshakeResponse = {
          initialConfig: {},
          contributionId: "mock",
          context: {
            extension: {
              extensionId: "mock-extension",
              id: "mock-ext-id",
              publisherId: "mock-publisher",
              version: "0.0.0",
            },
            user: {
              descriptor: "",
              displayName: "mock-user",
              id: "mock-user-id",
              imageUrl: "http://example.org",
              name: "mock-user-name",
            },
            host: {
              id: "mock-host-id",
              name: "mock-host",
              serviceVersion: "0.0.0",
              type: SDK.HostType.Organization,
            },
          },
        };
        return resp;
      },
    };
  });
  chan.getObjectRegistry().register("DevOps.ServiceManager", (ctx) => {
    console.log("DevOps.ServiceManager factory");
    console.dir(ctx);
    return {
      getService: (serviceId: string) => {
        console.log(`getService ${serviceId}`);
        switch (serviceId) {
          case CommonServiceIds.ProjectPageService:
            const svc: IProjectPageService = {
              getProject: async () => {
                const project: IProjectInfo = {
                  id: "mock-project-id",
                  name: "mock-name",
                };
                return project;
              },
            };
            return svc;
        }
        return {};
      },
    };
  });
}
