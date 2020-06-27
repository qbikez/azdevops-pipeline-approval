import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Tree, ITreeColumn } from "azure-devops-ui/TreeEx";
import {
  ObservableValue,
  IReadonlyObservableArray,
  ObservableArray,
} from "azure-devops-ui/Core/Observable";
import { ReleaseApprovalService } from "@src-root/hub/services/release-approval.service";
import { ListSelection } from "azure-devops-ui/List";
import {
  CommonServiceIds,
  IGlobalMessagesService,
} from "azure-devops-extension-api";
import {
  ArrayItemProvider,
  IItemProvider,
} from "azure-devops-ui/Utilities/Provider";
import { ISelectionRange } from "azure-devops-ui/Utilities/Selection";
import { ReleaseApprovalAction } from "@src-root/hub/model/ReleaseApprovalAction";
import {
  ReleaseApprovalEvents,
  EventType,
} from "@src-root/hub/model/ReleaseApprovalEvents";
import { renderGridPipelineCell } from "@src-root/hub/components/grid/pipelinecell.component";
import { renderGridReleaseInfoCell } from "@src-root/hub/components/grid/releaseinfocell.component";
import { renderGridApproverInfoCell } from "@src-root/hub/components/grid/approverinfocell.component";
import { renderGridActionsCell } from "@src-root/hub/components/grid/actionscell.component";
import { Card } from "azure-devops-ui/Card";
import { ReleaseApproval, Release } from "azure-devops-extension-api/Release";
import { Button } from "azure-devops-ui/Button";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import ReleaseApprovalForm from "@src-root/hub/components/form/form.component";
import {
  ReleaseService,
  ReleaseInfo,
} from "@src-root/hub/services/release.service";
import { renderLastRunColumn } from "./buildinfocell.component";
import { renderWorkItemsColumn } from "./workitemscell.component";
import {
  ITreeItemEx,
  ITreeItem,
  TreeItemProvider,
  ITreeItemProvider,
} from "azure-devops-ui/Utilities/TreeItemProvider";

export type ReleaseData = {
  id: number;
  approval: ReleaseApproval;
  info?: ReleaseInfo;
};

export type ReleaseRow = ITreeItemEx<ReleaseData>;

export default class ReleaseApprovalGrid extends React.Component {
  private _approvalsService: ReleaseApprovalService = new ReleaseApprovalService();
  private _releaseService: ReleaseService = new ReleaseService();
  private _treeItemProvider = new ItemProvider();
  private _pageLength: number = 20;
  private _hasMoreItems: ObservableValue<boolean> = new ObservableValue<
    boolean
  >(false);
  private _selection: ListSelection = new ListSelection({
    selectOnFocus: false,
    multiSelect: true,
  });
  private _selectedReleases: ArrayItemProvider<
    ReleaseApproval
  > = new ArrayItemProvider<ReleaseApproval>([]);
  private _approvalForm: React.RefObject<ReleaseApprovalForm>;
  private get dialog() {
    return this._approvalForm.current as ReleaseApprovalForm;
  }
  private _action: ObservableValue<ReleaseApprovalAction> = new ObservableValue<
    ReleaseApprovalAction
  >(ReleaseApprovalAction.Reject);

  private _configureGridColumns(): ITreeColumn<ReleaseData>[] {
    return [
      {
        id: "pipeline",
        name: "Release",
        renderCell: renderGridPipelineCell,
        width: 250,
      },
      {
        id: "releaseInfo",
        renderCell: renderGridReleaseInfoCell,
        width: 200,
      },
      {
        id: "buildInfo",
        name: "Pull Request",
        renderCell: renderLastRunColumn,
        width: -60,
      },
      {
        id: "workItems",
        name: "Work Items",
        renderCell: renderWorkItemsColumn,
        width: -60,
      },
      {
        id: "approverInfo",
        name: "Approval Status",
        renderCell: renderGridApproverInfoCell,
        width: -30,
      },
      {
        id: "actions",
        renderCell: renderGridActionsCell,
        width: 150,
      },
    ];
  }

  constructor(props: {}) {
    super(props);
    this._approvalForm = React.createRef();
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
    ReleaseApprovalEvents.subscribe(
      EventType.ApproveSingleRelease,
      (approval: ReleaseApproval) => {
        this.approveSingle(approval);
      }
    );
    ReleaseApprovalEvents.subscribe(EventType.RejectAllReleases, async () => {
      await this.rejectAll();
    });
    ReleaseApprovalEvents.subscribe(
      EventType.RejectSingleRelease,
      (approval: ReleaseApproval) => {
        this.rejectSingle(approval);
      }
    );

    this._selection.subscribe(
      (selection: ISelectionRange[], action: string) => {
        ReleaseApprovalEvents.fire(
          EventType.GridRowSelectionChanged,
          selection,
          action,
          this._selection.selectedCount
        );
      }
    );
  }

  render(): JSX.Element {
    this.loadData();
    return (
      <div className="flex-grow">
        <div>
          <Card
            className="flex-grow bolt-table-card"
            contentProps={{ contentPadding: false }}
          >
            <Tree<ReleaseData>
              columns={this._configureGridColumns()}
              itemProvider={this._treeItemProvider}
              selection={this._selection}
              onToggle={(event, treeItem: ITreeItemEx<ReleaseData>) => {
                //   treeItem.underlyingItem.childItems?.push(
                //     this.getRowShimmer(1)[0]
                //   );
                //   //this._treeItemProvider.toggle(treeItem.underlyingItem);
              }}
              scrollable={true}
            />
          </Card>
          <ConditionalChildren renderChildren={this._hasMoreItems}>
            <div style={{ marginTop: "10px" }}>
              <Button onClick={this.loadData} text="Load more..." />
            </div>
          </ConditionalChildren>
          <ReleaseApprovalForm ref={this._approvalForm} action={this._action} />
        </div>
      </div>
    );
  }

  private loadData = async () => {
    let continuationToken = 0;
    const lastIndex = this._treeItemProvider.value.length - 1;
    if (lastIndex >= 0) {
      const lastItem = this._treeItemProvider.value[lastIndex].underlyingItem
        .data;
      continuationToken = lastItem.id - 1;
    }
    const rowShimmer = this.getRowShimmer(1);
    this._treeItemProvider.add(rowShimmer[0]);
    const approvals: ReleaseData[] = await this._approvalsService.findApprovals(
      this._pageLength,
      continuationToken
    );
    const promises = approvals.map(async (a) => {
      await this._releaseService.getLinks(a);
    });
    await Promise.all(promises);

    await Promise.all(
      approvals.map(async (a) => {
        const info = await this._releaseService.getReleaseInfo(
          a.approval.release.id,
          true
        );
        a.info = info;
      })
    );
    this._hasMoreItems.value = this._pageLength == approvals.length;
    const shimmer = this._treeItemProvider.value[
      this._treeItemProvider.length - 1
    ];

    //this._treeItemProvider.remove(shimmer.underlyingItem);

    const notInTable = approvals.filter((a) =>
      this._treeItemProvider.value.every(
        (x) => x.underlyingItem?.data?.id !== a.id
      )
    );
    const rows = await Promise.all(
      notInTable.map(async (a) => {
        const row = toTreeItem(a);
        if (a.info?.nextReleases) row.childItems = [];

        // const nextRows =
        //   a.info?.nextReleases?.map(async (next) => {
        //     const info = await this._releaseService.getReleaseInfo(next.id);
        //     const child: ReleaseApprovalEx = {
        //       ...a,
        //       info,
        //     } as ReleaseApprovalEx;
        //     const childRow = toTreeItem(child);
        //     row.childItems?.push(childRow);
        //     return childRow;
        //   }) || [];

        //= await Promise.all(nextRows);
        //row.expanded = true;
        return row;
      })
    );
    rows.forEach((r) => this._treeItemProvider.add(r));
  };

  private getRowShimmer(length: number): any[] {
    return new Array(length).fill(
      new ObservableValue<ReleaseApproval | undefined>(undefined)
    );
  }

  async refreshGrid(): Promise<void> {
    this._treeItemProvider.removeAll();
    await this.loadData();
  }

  private approveSingle(approval: ReleaseApproval): void {
    this._selectedReleases = new ArrayItemProvider<ReleaseApproval>([approval]);
    this.approve();
  }

  async approveAll(): Promise<void> {
    if (this._selection.value.length == 0) {
      await this.showErrorMessage(
        "You need to select at least one release to Approve."
      );
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
      await this.showErrorMessage(
        "You need to select at least one release to Reject."
      );
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
    this._selection.value.forEach((range: ISelectionRange) => {
      for (
        let index: number = range.beginIndex;
        index <= range.endIndex;
        index++
      ) {
        releases.push(
          this._treeItemProvider.value[index].underlyingItem.data.approval
        );
      }
    });
    this._selectedReleases = new ArrayItemProvider<ReleaseApproval>(releases);
  }

  private async showErrorMessage(message: string): Promise<void> {
    const globalMessagesSvc = await SDK.getService<IGlobalMessagesService>(
      CommonServiceIds.GlobalMessagesService
    );
    globalMessagesSvc.addToast({
      duration: 3000,
      message: message,
    });
  }
}
function toTreeItem(release: ReleaseData): ITreeItem<ReleaseData> {
  const row: ITreeItem<ReleaseData> = {
    data: release,
  };
  return row;
}

class ItemProvider extends ObservableArray<ReleaseRow> {
  public add(item: ITreeItem<ReleaseData>) {
    this.push({
      underlyingItem: item,
      depth: 0,
    });
  }
}
