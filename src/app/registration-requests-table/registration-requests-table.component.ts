import { Component, OnInit } from "@angular/core";
import { RegistrationRequestsService } from "../service/registration-requests.service";

@Component({
  selector: "app-registration-requests-table",
  templateUrl: "./registration-requests-table.component.html",
  styleUrls: ["./registration-requests-table.component.scss"]
})
export class RegistrationRequestsTableComponent implements OnInit {
  public registrationRequests = [];
  public hasedEmail: string;

  constructor(
    private _registrationRequestsService: RegistrationRequestsService
  ) {}

  ngOnInit() {
    this._registrationRequestsService
      .getRegistrationRequests()
      .subscribe(data => (this.registrationRequests = data));
  }

  approveRegistrationRequest(hashedEmail: string) {
    console.log("Approving registration");
    this._registrationRequestsService.approveRegistrationRequest(hashedEmail);
    console.log("Getting everybody");
    this._registrationRequestsService
      .getRegistrationRequests()
      .subscribe(data => (this.registrationRequests = data));
  }
}
