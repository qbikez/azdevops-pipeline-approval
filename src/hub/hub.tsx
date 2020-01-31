import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import ReleaseApprovalGrid from "@src-root/hub/components/grid/grid.component";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { ReleaseApprovalEvents, EventType } from "./model/ReleaseApprovalEvents";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import ReleaseApprovalTree from "./components/tree/tree.component";

class Hub extends React.Component<{}> {

  private _stageGroupFlag: string = "stageGrouping";

  private _releaseGrid: React.RefObject<ReleaseApprovalGrid>;
  private _normalGridMode = new ObservableValue<boolean>(true);
  private _stageGroupMode = new ObservableValue<boolean>(false);

  constructor(props: {}) {
    super(props);
    this._releaseGrid = React.createRef();
    SDK.init();
    const queryString = new URLSearchParams(window.location.search);
    const stageGroupEnabled = queryString.has(this._stageGroupFlag) && JSON.parse(queryString.get(this._stageGroupFlag) || "false");
    this._normalGridMode.value = !stageGroupEnabled;
    this._stageGroupMode.value = stageGroupEnabled;
  }

  render(): JSX.Element {
    return (
      <Page className="flex-grow">
        <Header
          title={"Releases to Approve"}
          titleSize={TitleSize.Medium}
          titleIconProps={{ iconName: "Rocket" }}
          commandBarItems={this._createCommandBarItems} />
        <div className="page-content page-content-top">
          <ConditionalChildren renderChildren={this._normalGridMode}>
            <ReleaseApprovalGrid ref={this._releaseGrid} />
          </ConditionalChildren>
          <ConditionalChildren renderChildren={this._stageGroupMode}>
            <ReleaseApprovalTree />
          </ConditionalChildren>
        </div>
      </Page>
    );
  }

  private _createCommandBarItems: IHeaderCommandBarItem[] = [
    {
      id: "approve-all",
      iconProps: {
        iconName: "CheckMark"
      },
      important: true,
      onActivate: () => ReleaseApprovalEvents.fire(EventType.ApproveAllReleases),
      text: "Approve All",
      isPrimary: true
    },
    {
      id: "reject-all",
      iconProps: {
        iconName: "Cancel"
      },
      important: true,
      className: "danger",
      onActivate: () => ReleaseApprovalEvents.fire(EventType.RejectAllReleases),
      text: "Reject All"
    },
    {
      id: "refresh",
      iconProps: {
        iconName: "Refresh"
      },
      important: true,
      onActivate: () => ReleaseApprovalEvents.fire(EventType.RefreshGrid),
      text: "Refresh"
    }
  ];
}

ReactDOM.render(<Hub />, document.getElementById("root"));
