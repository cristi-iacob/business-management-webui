import { Component, OnInit, Input } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { ProjectsService } from './user-projects-table.service';
import { ProjectExperienceTransport, ProjectExperienceEntry, ChangeModel } from '../models/project-experience.model';
import { getLocaleEraNames } from '@angular/common';
import {MatDialog, MatDialogConfig} from "@angular/material";
import { AddProjectDialogComponent } from '../add-project-dialog/add-project-dialog.component';
import { UpdateStringDialogComponent } from '../update-string-dialog/update-string-dialog.component';

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
  edits: ChangeModel[] = [];
  email: string = "";
  firstName: string = "";
  lastName: string = "";
  region: string = "";
  consultingLevel: string = "";

  updatedFirstName: boolean = false;
  updatedLastName: boolean = false;

  ngOnInit(): void {
    this.render();
  }

  render() {
    this.projectsService.getFullUserSpecification("hans.futterman@test.com", this.diffMode).subscribe(resp => {
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
      let entries: ProjectExperienceEntry[] = [];
      resp.body.projectExperience.forEach(transport => {
        entries.push(this.mapProjectExperienceTransportToEntry(transport));
      });
      this.projectExperienceEntries = entries;
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
  columnsToDisplay = [{
    value: 'consultingLevel',
    displayName: 'Consulting Level'
  }, {
    value: 'industry',
    displayName: 'Industry'
  }, {
    value: 'startDate',
    displayName: 'Start Date'
  }, {
    value: 'endDate',
    displayName: 'End Date'
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
      colls.push("delete")
    }
    return colls;
  }

  constructor (private projectsService: ProjectsService, private dialog: MatDialog) {}

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
    this.projectsService.saveEdits(this.edits, 'hans.futterman@test.com').subscribe();
  }

  addClickHandler() {
    this.openAddProjectDialog();
  }

  acceptClickHandler() {
    this.projectsService.acceptChanges('hans.futterman@test.com').subscribe();
  }

  discardClickHandler() {
    this.projectsService.discardChanges('hans.futterman@test.com').subscribe();
  }

  editFirstNameClickHandler() {
    this.openUpdateStringDialog(this.updateFirstName);
  }

  openUpdateStringDialog(action) {
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
    this.openUpdateStringDialog(this.updateLastName);
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
    console.log(this.edits);
  }
}
