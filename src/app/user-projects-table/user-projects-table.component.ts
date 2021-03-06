import { Component, OnInit, Input } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { ProjectsService } from './user-projects-table.service';
import { ProjectExperienceTransport, ProjectExperienceEntry, ChangeModel, Skill, ItemState } from '../models/project-experience.model';
import { getLocaleEraNames } from '@angular/common';
import {MatDialog, MatDialogConfig} from "@angular/material";
import { AddProjectDialogComponent } from '../add-project-dialog/add-project-dialog.component';
import { UpdateStringDialogComponent } from '../update-string-dialog/update-string-dialog.component';
import { UpdateConsultingLevelDialogComponent } from '../update-consulting-level-dialog/update-consulting-level-dialog.component';
import { UpdateRegionDialogComponent } from '../update-region-dialog/update-region-dialog.component';
import {TranslateService} from '@ngx-translate/core';
import {log} from 'util';
import { AddSkillDialogComponent } from '../add-skill-dialog/add-skill-dialog.component';
import { ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector: 'app-user-projects-table',
  templateUrl: './user-projects-table.component.html',
  styleUrls: ['./user-projects-table.component.scss'],
  providers: [ProjectsService],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class UserProjectsTableComponent implements OnInit {

  @Input() diffMode: boolean;
  @Input() editMode: boolean;
  @Input() userEmail: string = null;

  edits: ChangeModel[] = [];
  email: string = "";
  firstName: string = "";
  lastName: string = "";
  region: string = "";
  consultingLevel: string = "";

  updatedFirstName: boolean = false;
  updatedLastName: boolean = false;
  updatedConsultingLevel: boolean = false;
  updatedRegion: boolean = false;
  industry: string = this.translateService.instant('PLAYGROUND.INDUSTRY');
  viewLoaded: boolean = false;

  ngOnInit(): void {
    this.render();
  }

  render() {
    this.viewLoaded = false;
    this.projectsService.getFullUserSpecification(this.userEmail, this.diffMode).subscribe(resp => {
      this.email = resp.body.email;
      this.firstName = resp.body.firstName;
      this.lastName = resp.body.lastName
      this.region = resp.body.region;
      this.consultingLevel = resp.body.consultingLevel;
      var metadata = resp.body.metadata;

      if (metadata.FIRST_NAME && metadata.FIRST_NAME === "UPDATE") {
        this.updatedFirstName = true;
      } else {
        this.updatedFirstName = false;
      }
      if (metadata.LAST_NAME === "UPDATE") {
        this.updatedLastName = true;
      } else {
        this.updatedLastName = false;
      }
      if (metadata.CONSULTING_LEVEL === "UPDATE") {
        this.updatedConsultingLevel = true;
      } else {
        this.updatedConsultingLevel = false;
      }
      if (metadata.REGION === "UPDATE") {
        this.updatedRegion = true;
      } else {
        this.updatedRegion = false;
      }

      let entries: ProjectExperienceEntry[] = [];
      resp.body.projectExperience.forEach(transport => {
        entries.push(this.mapProjectExperienceTransportToEntry(transport));
      });
      this.projectExperienceEntries = entries;

      let skills: Skill[] = [];
      resp.body.skills.forEach(s => {
        skills.push(s);
      })
      this.skills = skills;
      this.renderPieChart();
      this.viewLoaded = true;
    });

    this.edits = [];
  }

  mapProjectExperienceTransportToEntry(transport: ProjectExperienceTransport) : ProjectExperienceEntry {
    return {
      id: transport.id,
      itemState: transport.itemState,
      startDate: this.formatDateTimeToString(new Date(transport.startDate * 1000)),
      endDate: this.formatDateTimeToString(new Date(transport.endDate * 1000)),
      consultingLevel: transport.consultingLevel,
      projectStartDate: this.formatDateTimeToString(new Date(transport.projectStartDate * 1000)),
      projectEndDate: this.formatDateTimeToString(new Date(transport.projectEndDate * 1000)),
      description: transport.description,
      projectName: transport.projectName,
      industry: transport.industry,
      clientAddress: transport.clientAddress,
      clientName: transport.clientName
    };
  }

  formatDateTimeToString(date: Date): string {
    let str: string = '';
    str += date.getFullYear();
    str += '-' + (date.getMonth() + 1);
    str += '-' + (date.getDate() + 1);
    return str;
  }

  projectExperienceEntries: ProjectExperienceEntry[];
  skills: Skill[];
  columnsToDisplay = [{
    value: 'consultingLevel',
    displayName: 'USERDETAILS.CONSULTING'
  }, {
    value: 'industry',
    displayName: 'PLAYGROUND.INDUSTRY'
  }, {
    value: 'startDate',
    displayName: 'PROJECT.START'
  }, {
    value: 'endDate',
    displayName: 'PROJECT.END'
  }];
  allColls = ['consultingLevel', 'industry', 'startDate', 'endDate'];
  expandedElement: ProjectExperienceEntry | null;

  getAllColumnsToDisplay() {
    var colls = [];
    this.columnsToDisplay.forEach(el => {
      colls.push(el);
    });
    if (this.editMode) {
      colls.push({value: "delete", displayName: "Delete"})
    }

    return colls;
  }

  getAllColls() {
    var colls = [];
    this.allColls.forEach(el => {
      colls.push(el);
    });
    if (this.editMode) {
      colls.push("delete");
    }
    return colls;
  }

  constructor(private projectsService: ProjectsService, private dialog: MatDialog, private translateService: TranslateService,){}

  openAddProjectDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.data = {
      id: 1,
      title: "Add new Project"
    }

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    const dialogRef = this.dialog.open(AddProjectDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      data => this.addProject(data)
    );
  }

  deleteHandler(el) {
    var id = el.id;
    var resource = "PROJECT";
    var changeType = "DELETE";
    this.projectExperienceEntries = this.projectExperienceEntries.filter(p => p.id !== id);
    var changeModel: ChangeModel = {
      resource: resource,
      changeType: changeType,
      args: {"id": id}
    }

    this.edits.push(changeModel);
    console.log(this.edits);
  }

  saveEditsHandler() {
    this.projectsService.saveEdits(this.edits, this.userEmail).subscribe();
    this.editMode = false;
    this.render();
  }

  discardEditsHandler() {
    this.edits = [];
    this.editMode = false;
    this.render();
  }

  addClickHandler() {
    this.openAddProjectDialog();
  }

  acceptClickHandler() {
    var ref = this;
    this.projectsService.acceptChanges(this.userEmail).subscribe(s => ref.render());
  }

  discardClickHandler() {
    var ref = this;
    this.projectsService.discardChanges(this.userEmail).subscribe(s => ref.render());
  }

  editFirstNameClickHandler() {
    this.openUpdateStringDialog(this.updateFirstName, "Update first name");
  }

  openUpdateStringDialog(action, title) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.data = {
      id: 1,
      title: "Update first name"
    }

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    const dialogRef = this.dialog.open(UpdateStringDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      data => action(data, this)
    );
  }

  updateFirstName(data, ref) {
    if (!data || !data.value) {
      return;
    }
    ref.firstName = data.value;
    var changeType = "UPDATE";
    var resource = "FIRST_NAME";
    var args = {
      firstName: data.value
    };
    var changeModel: ChangeModel = {
      changeType: changeType,
      resource: resource,
      args: args
    }
    ref.edits.push(changeModel);
  }

  editLastNameClickHandler() {
    this.openUpdateStringDialog(this.updateLastName, "Update last name");
  }

  updateLastName(data, ref) {
    if (!data || !data.value) {
      return;
    }
    ref.lastName = data.value;
    var changeType = "UPDATE";
    var resource = "LAST_NAME";
    var args = {
      lastName: data.value
    };
    var changeModel: ChangeModel = {
      changeType: changeType,
      resource: resource,
      args: args
    }
    ref.edits.push(changeModel);
  }

  editConsultingLevelClickHandler() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.data = {
      id: 1,
      title: ""
    }

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    const dialogRef = this.dialog.open(UpdateConsultingLevelDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      data => this.updateConsultingLevel(data, this)
    );
  }

  updateConsultingLevel(data, ref) {
    if (!data || !data.consultingLevel) {
      return;
    }
    ref.consultingLevel = data.consultingLevel.name;
    var changeType = "UPDATE";
    var resource = "CONSULTING_LEVEL";
    var args = {
      consultingLevelId: data.consultingLevel.id
    };
    var changeModel: ChangeModel = {
      changeType: changeType,
      resource: resource,
      args: args
    }
    ref.edits.push(changeModel);
  }

  editRegionClickHandler() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.data = {
      id: 1,
      title: ""
    }

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    const dialogRef = this.dialog.open(UpdateRegionDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      data => this.updateRegion(data, this)
    );
  }

  updateRegion(data, ref) {
    if (!data || !data.region) {
      return;
    }
    ref.region = data.region.name;
    var changeType = "UPDATE";
    var resource = "REGION";
    var args = {
      regionId: data.region.id
    };
    var changeModel: ChangeModel = {
      changeType: changeType,
      resource: resource,
      args: args
    }
    ref.edits.push(changeModel);
  }


  addProject(data) {
    if (!data) {
      return;
    }
    var newId = '' + Math.floor(Date.now() / 1000)
    var changeType = 'ADD';
    var resource = 'PROJECT';
    var startDate = data.startDate;
    var endDate = data.endDate;

    if (!startDate || !endDate || !data.consultingLevel || !data.project || !data.description) {
      return;
    }
    var args = {
      newId: newId,
      consultingLevelId: data.consultingLevel,
      description: data.description,
      endDate: endDate.getTime() / 1000,
      startDate: startDate.getTime() / 1000,
      projectId: data.project
    }

    this.projectsService.patchProjectExperience(args).subscribe(r => {
      var x: ProjectExperienceEntry[] = [];
      this.projectExperienceEntries.forEach(el => {
        x.push(el)
      });
      x.push(this.mapProjectExperienceTransportToEntry(r));
      this.projectExperienceEntries = x;
      console.log(this.projectExperienceEntries);
    });
    var changeModel: ChangeModel = {
      resource: resource,
      changeType: changeType,
      args: args
    }

    this.edits.push(changeModel);
  }

  removeOption(skill) {
    if (skill.itemState === "PATCHED") {
      this.edits = this.edits.filter(e => !(e.resource === "SKILL" && e.args.tmp === skill.id));
      this.skills = this.skills.filter(s => s.id !== skill.id);
      this.renderPieChart();
      return;
    }
    var resource = "SKILL";
    var changeType = "DELETE";
    this.skills = this.skills.filter(s => s.id !== skill.id);
    this.renderPieChart();
    var changeModel: ChangeModel = {
      resource: resource,
      changeType: changeType,
      args: {"id": skill.id}
    }

    this.edits.push(changeModel);
  }

  addSkillClickHandler() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.data = {
      id: 1
    }

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    const dialogRef = this.dialog.open(AddSkillDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      data => this.addSkill(data)
    );
  }

  addSkill(data) {
    if (!data) {
      return;
    }
    var changeType = 'ADD';
    var resource = 'SKILL';

    var args = {
      id: data.skill.id,
      tmp: null
    }

    this.projectsService.patchSkill(args).subscribe(r => {
      var x: Skill[] = [];
      this.skills.forEach(el => {
        x.push(el)
      });
      args.tmp = r.id;
      x.push(r);
      this.skills = x;
      this.renderPieChart();
      var changeModel: ChangeModel = {
        resource: resource,
        changeType: changeType,
        args: args
      }

      this.edits.push(changeModel);
    });
  }

  enterEditMode() {
    this.editMode = true;
  }


  public pieChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      position: 'bottom',
    },
    aspectRatio: 1.3,
    title: {display: false, position: 'top', text: 'Skill distribution', fontSize: 30},
    plugins: {
      datalabels: {
        formatter: (value, ctx) => {
          const label = ctx.chart.data.labels[ctx.dataIndex];
          return label;
        },
      },
    }
  };
  public pieChartLabels: Label[] = [];
  public pieChartData: number[] = [];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartColors = [
    {
      backgroundColor: ['rgba(35, 203, 167, 1)',
      'rgba(246, 71, 71, 1)',
      'rgba(0, 181, 204, 1)',
      'rgba(36, 37, 42, 1)',
      'rgba(104, 195, 163, 1)',
      'rgba(242, 120, 75, 1)',
      'rgba(191, 85, 236, 1)',
      'rgba(200, 247, 197, 1)',
      'rgba(68, 108, 179, 1)',
      'rgba(250, 216, 89, 1)'
    ],
    },
  ];
  renderPieChart() {
    var skills = this.skills;
    var grouped = skills.reduce((r, a) => {
      r[a.area] = [...r[a.area] || [], a];
      return r;
    }, {});
    var labels = Object.keys(grouped);
    var data = Object.values<Skill[]>(grouped).map(x => x.length);
    this.pieChartLabels = labels;
    this.pieChartData = data;
  }
}
