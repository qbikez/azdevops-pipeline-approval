import * as React from "react";
import { Panel } from "azure-devops-ui/Panel";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import {
  ReleaseApprovalAction,
  ActionType,
} from "@src-root/hub/model/ReleaseApprovalAction";
import { Observer } from "azure-devops-ui/Observer";
import { Card } from "azure-devops-ui/Card";
import { FormReleaseList } from "@src-root/hub/components/form/releaselist.component";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { FormDeferredDeployment } from "@src-root/hub/components/form/deferreddeployment.component";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import {
  ReleaseApprovalEvents,
  EventType,
} from "@src-root/hub/model/ReleaseApprovalEvents";
import { ReleaseApproval } from "azure-devops-extension-api/Release";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { ReleaseData } from "../grid/releaseapprovalgrid.component";

export interface IReleaseApprovalFormProps {
  action: ObservableValue<ReleaseApprovalAction>;
  onConfirm: (
    releases: ReleaseData[],
    toCancel: ReleaseData[],
    action: ReleaseApprovalAction,
    comment: string,
    deferredDate: Date | null
  ) => Promise<void>;
}

export default class ReleaseApprovalForm extends React.Component<
  IReleaseApprovalFormProps
> {
  private _isOpen: ObservableValue<boolean> = new ObservableValue<boolean>(
    false
  );
  private _releases?: ArrayItemProvider<ReleaseData>;
  private _releasesToCancel?: ArrayItemProvider<ReleaseData>;
  private _approvalComment = new ObservableValue<string>("");
  private _deferredDeployment: React.RefObject<FormDeferredDeployment>;
  private get deferredDeployment() {
    return this._deferredDeployment.current as FormDeferredDeployment;
  }

  constructor(props: IReleaseApprovalFormProps) {
    super(props);
    this._deferredDeployment = React.createRef();
  }

  render(): JSX.Element {
    return (
      <Observer isDialogOpen={this._isOpen}>
        {(props: { isDialogOpen: boolean }) => {
          return props.isDialogOpen ? (
            <Panel
              lightDismiss={false}
              titleProps={{
                text: `Release ${this.props.action.value.title} confirmation`,
              }}
              description={`Confirm that you want to ${this.props.action.value.action} the following releases:`}
              footerButtonProps={[
                {
                  text: "Cancel",
                  onClick: this.closeDialog,
                },
                {
                  text: "Confirm",
                  onClick: this.confirmAction,
                  primary: true,
                },
              ]}
              onDismiss={this.closeDialog}
            >
              <div>
                <Card>
                  <div className="ms-Grid" dir="ltr">
                    <div
                      className="ms-Grid-row"
                      style={{
                        display: "flex",
                        maxHeight: "200px",
                      }}
                    >
                      <FormReleaseList releases={this._releases} />
                    </div>
                    <div className="ms-Grid-row">
                      <FormItem label="Comment:">
                        <TextField
                          value={this._approvalComment}
                          onChange={(e, newValue) =>
                            (this._approvalComment.value = newValue)
                          }
                          multiline
                          rows={4}
                          width={TextFieldWidth.auto}
                        />
                      </FormItem>
                    </div>
                  </div>
                </Card>

                <ConditionalChildren
                  renderChildren={!!this._releasesToCancel?.length}
                >
                  <div>
                    This will reject/cancel the following (older) releases:
                  </div>
                  <Card>
                    <FormReleaseList releases={this._releasesToCancel} />
                  </Card>
                </ConditionalChildren>
                <ConditionalChildren
                  renderChildren={this.props.action.value.allowDefer}
                >
                  <FormDeferredDeployment ref={this._deferredDeployment} />
                </ConditionalChildren>
              </div>
            </Panel>
          ) : null;
        }}
      </Observer>
    );
  }

  openDialog(
    releases: ArrayItemProvider<ReleaseData>,
    releasesToCancel?: ArrayItemProvider<ReleaseData>
  ): void {
    this._approvalComment.value = "";
    this._releases = releases;
    console.log("openDialog releasesToCancel:", releasesToCancel);
    this._releasesToCancel = releasesToCancel;
    this._isOpen.value = true;
  }

  closeDialog = () => {
    this._isOpen.value = false;
  };

  private confirmAction = async () => {
    if (!this._releases) return;
    let deferredDate: Date | null = null;
    if (
      this.deferredDeployment &&
      this.deferredDeployment.deferredDeploymentEnabled &&
      this.props.action.value.allowDefer
    ) {
      if (!this.deferredDeployment.validateDeferredDeploymentDate()) return;
      deferredDate = this.deferredDeployment.selectedDate;
    }

    if (this.props.onConfirm) {
      await this.props.onConfirm(
        this._releases.value,
        this._releasesToCancel?.value || [],
        this.props.action.value,
        this._approvalComment.value,
        deferredDate
      );
    }

    this.closeDialog();
    ReleaseApprovalEvents.fire(EventType.ClearGridSelection);
    setTimeout(() => ReleaseApprovalEvents.fire(EventType.RefreshGrid), 1000);
  };
}
