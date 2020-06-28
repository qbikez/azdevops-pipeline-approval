import * as React from "react";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import {
  ScrollableList,
  IListItemDetails,
  ListItem,
} from "azure-devops-ui/List";
import { IconSize, Icon } from "azure-devops-ui/Icon";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Colors } from "@src-root/hub/model/Colors";
import {
  ReleaseApproval,
  ApprovalType,
} from "azure-devops-extension-api/Release";
import { ReleaseData } from "../grid/releaseapprovalgrid.component";

export interface IFormReleaseListProps {
  releases?: ArrayItemProvider<ReleaseData>;
}

export class FormReleaseList extends React.Component<IFormReleaseListProps> {
  constructor(props: IFormReleaseListProps) {
    super(props);
  }

  render(): JSX.Element {
    const releases =
      this.props.releases || new ArrayItemProvider<ReleaseData>([]);

    return (
      <ScrollableList
        itemProvider={releases}
        renderRow={this._renderListRow}
        width="100%"
      />
    );
  }

  _renderListRow = (
    index: number,
    item: ReleaseData,
    details: IListItemDetails<ReleaseData>,
    key?: string
  ): JSX.Element => {
    const approval = item.approval;
    const approvalType = approval?.approvalType;
    let approvalTypeLabel: string = "";
    switch (approvalType) {
      case ApprovalType.PreDeploy:
        approvalTypeLabel = "Pre-Deployment";
        break;
      case ApprovalType.PostDeploy:
        approvalTypeLabel = "Post-Deployment";
        break;
    }

    return (
      <ListItem
        key={key || "list-item" + index}
        index={index}
        details={details}
      >
        <div className="flex-row h-scroll-hidden">
          <Icon iconName="Rocket" size={IconSize.medium} />
          <div
            style={{ marginLeft: "10px", padding: "10px 0px" }}
            className="flex-column h-scroll-hidden"
          >
            <span className="text-ellipsis">{item.releaseDefinition.name}</span>
            <span
              className="fontSizeMS font-size-ms text-ellipsis secondary-text"
              style={{ marginTop: "5px" }}
            >
              <PillGroup className="flex-row">
                <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                  {item.release.name}
                </Pill>
                <Pill
                  size={PillSize.compact}
                  variant={PillVariant.colored}
                  color={Colors.darkRedColor}
                >
                  {item.releaseEnvironment.name}
                </Pill>
                {approval ? (
                  <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                    {approvalTypeLabel}
                  </Pill>
                ) : (
                  ""
                )}
              </PillGroup>
            </span>
          </div>
        </div>
      </ListItem>
    );
  };
}
