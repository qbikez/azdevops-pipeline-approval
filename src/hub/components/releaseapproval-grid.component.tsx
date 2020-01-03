import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Table, ITableColumn, ColumnSelect } from "azure-devops-ui/Table";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { ListSelection } from "azure-devops-ui/List";
import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import ReleaseApprovalDialog from "@src-root/hub/components/releaseapproval-dialog.component";
import { ReleaseApprovalAction } from "@src-root/hub/model/ReleaseApprovalAction";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { renderGridPipelineCell } from "@src-root/hub/components/releaseapproval-grid-pipelinecell.component";
import { renderGridReleaseInfoCell } from "@src-root/hub/components/releaseapproval-grid-releaseinfocell.component";
import { renderGridApproverInfoCell } from "@src-root/hub/components/releaseapproval-grid-approverinfocell.component";
import { renderGridActionsCell } from "@src-root/hub/components/releaseapproval-grid-actionscell.component";
import { Card } from "azure-devops-ui/Card";
import { ReleaseApproval } from "azure-devops-extension-api/Release";

export default class ReleaseApprovalGrid extends React.Component {

    private _releaseService: ReleaseApprovalService = new ReleaseApprovalService();
    private _tableRowShimmer = new Array(5).fill(new ObservableValue<ReleaseApproval | undefined>(undefined));
    private _tableRowData: ObservableArray<ReleaseApproval> = new ObservableArray<ReleaseApproval>(this._tableRowShimmer);
    private _selection: ListSelection = new ListSelection({ selectOnFocus: false, multiSelect: true });
    private _selectedReleases: ArrayItemProvider<ReleaseApproval> = new ArrayItemProvider<ReleaseApproval>([]);
    private _dialog: React.RefObject<ReleaseApprovalDialog>;
    private get dialog() {
        return this._dialog.current as ReleaseApprovalDialog;
    }
    private _action: ObservableValue<ReleaseApprovalAction> = new ObservableValue<ReleaseApprovalAction>(ReleaseApprovalAction.Reject);

    private _configureGridColumns(): ITableColumn<{}>[] {
        return [
            new ColumnSelect() as ITableColumn<{}>,
            {
                id: "release",
                name: "Release",
                renderCell: renderGridPipelineCell,
                width: 250
            },
            {
                id: "releaseInfo",
                renderCell: renderGridReleaseInfoCell,
                width: -40
            },
            {
                id: "approverInfo",
                renderCell: renderGridApproverInfoCell,
                width: -60
            },
            {
                id: "actions",
                renderCell: renderGridActionsCell,
                width: 150
            }
        ]
    };

    constructor(props: {}) {
        super(props);
        this._dialog = React.createRef();
        this.subscribeEvents();
    }

    private subscribeEvents(): void {
        ReleaseApprovalEvents.subscribe(EventType.RefreshGrid, async () => {
            await this.refreshGrid();
        });
        ReleaseApprovalEvents.subscribe(EventType.ClearGridSelection, () => {
            this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([]);
        });
        ReleaseApprovalEvents.subscribe(EventType.ApproveAllReleases, async () => {
            await this.approveAll();
        });
        ReleaseApprovalEvents.subscribe(EventType.ApproveSingleRelease, (approval: ReleaseApproval) => {
            this.approveSingle(approval);
        });
        ReleaseApprovalEvents.subscribe(EventType.RejectAllReleases, async () => {
            await this.rejectAll();
        });
        ReleaseApprovalEvents.subscribe(EventType.RejectSingleRelease, (approval: ReleaseApproval) => {
            this.rejectSingle(approval);
        });
    }

    render(): JSX.Element {
        this.loadData();
        return (
            <div className="flex-grow">
                <div>
                    <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                        <Table columns={this._configureGridColumns()}
                            itemProvider={this._tableRowData}
                            selection={this._selection} />
                    </Card>
                    <ReleaseApprovalDialog
                        ref={this._dialog}
                        action={this._action} />
                </div>
            </div>
        );
    }

    private async loadData(): Promise<void> {
        this._tableRowData.removeAll();
        this._tableRowData.push(...this._tableRowShimmer);
        const approvals = await this._releaseService.listAll();
        this._tableRowData.removeAll();
        this._tableRowData.push(...approvals);
    }

    async refreshGrid(): Promise<void> {
        await this.loadData();
    }

    private approveSingle(approval: ReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([approval]);
        this.approve();
    }

    async approveAll(): Promise<void> {
        if (this._selection.value.length == 0) {
            await this.showErrorMessage("You need to select at least one release to Approve.");
            return;
        }
        this.getSelectedReleases();
        this.approve();
    }

    private approve(): void {
        this._action.value = ReleaseApprovalAction.Approve;
        this.dialog.openDialog(this._selectedReleases);
    }

    private rejectSingle(approval: ReleaseApproval): void {
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([approval]);
        this.reject();
    }

    async rejectAll(): Promise<void> {
        if (this._selection.value.length == 0) {
            await this.showErrorMessage("You need to select at least one release to Reject.");
            return;
        }
        this.getSelectedReleases();
        this.reject();
    }

    private reject(): void {
        this._action.value = ReleaseApprovalAction.Reject;
        this.dialog.openDialog(this._selectedReleases);
    }

    private getSelectedReleases(): void {
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([]);
        let releases: Array<ReleaseApproval> = new Array<ReleaseApproval>();
        this._selection.value.forEach((range: ISelectionRange, rangeIndex: number) => {
            for (let index: number = range.beginIndex; index <= range.endIndex; index++) {
                releases.push(this._tableRowData.value[index]);
            }
        });
        this._selectedReleases = new ArrayItemProvider<ReleaseApproval>(releases);
    }

    private async showErrorMessage(message: string): Promise<void> {
        const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        globalMessagesSvc.addToast({
            duration: 3000,
            message: message
        });
    }
}