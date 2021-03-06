import { Component, OnInit } from '@angular/core';
import { CommunicationService } from './../../services/communication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-issuer',
  templateUrl: './issuer.component.html',
  styleUrls: ['./issuer.component.scss']
})
export class IssuerComponent implements OnInit {

	new_schema_attributes = [];
	schema_name = "";
	schemas:any = [];
	selected_schema:any = {};
	users = [];
	proof_input = "";
	invalid_proof = false

	constructor(private comm: CommunicationService, private snack_bar: MatSnackBar, private dialog: MatDialog) { }

	ngOnInit() {
		this.getSchemas();
		this.getUsers();
	}

	getSchemas() {
		this.comm.get('issuer/schemaAttributes').subscribe((res: any) => {
			console.log(res);
			res.forEach((schema) => {
				let updated_attributes = [];
				schema.attributes.forEach((attribute) => {
					updated_attributes.push({
						name: attribute,
						value: ""
					});
				});
				schema.attributes = updated_attributes;
			});
			this.schemas = res;
			this.selected_schema = res[0];
		})
	}

	getUsers() {
		this.comm.get('user/getalluser').subscribe((users: any) => {
			this.users = users.data;
			console.log(this.users);
		});
	}

	add_attribute(attribute) {
		if (attribute && !this.new_schema_attributes.includes(attribute))
			this.new_schema_attributes.push(attribute);
	}

	remove_attribute(index) {
		this.new_schema_attributes.splice(index, 1);
	}

	create_schema() {
		let schema_obj = {
			attributes: JSON.stringify(this.new_schema_attributes),
			schema_name: this.schema_name
		}
		console.log(schema_obj);
		this.comm.sendPost("issuer/schema", schema_obj).subscribe((res) => {
			this.snack_bar.open("Schema Created Successfully", "Close", {duration: 5000});
		});
	}

	updateSelectedSchema(ev) {
		for (let i=0; i<this.schemas.length; i++) {
			if (this.schemas[i].schema_id == ev.target.value) {
				this.selected_schema = this.schemas[i];
				break;
			}
		}
	}

	issueCredential() {
		let req_data = {
			credential_definition_id: this.selected_schema.credential_definition_id,
			attributes: JSON.stringify(this.selected_schema.attributes)
		}
		this.comm.sendPost('issuer/sendOffer', req_data).subscribe((res) => {
			this.snack_bar.open("Credential Issued Successfully", "Close", {duration: 5000});
		});
	}

	verifyProof() {
		this.comm.sendPost('user/verify', {data: this.proof_input}).subscribe((res: any) => {
			this.invalid_proof = false;
			console.log(res.data);
			let content_html = '<mat-list role="list">';
			Object.keys(res.data).forEach((key) => {
				content_html += `<mat-list-item role="listitem"><strong>${key}:</strong> ${res.data[key]}</mat-list-item><br>`;
			})
			content_html += '</mat-list>';
			const dialogRef = this.dialog.open(DialogComponent, {
				width: "600px",
				data: {
					title: "Verified User Data",
					content: content_html
				}
			});
		}, (err) => {
			console.log(err);
			this.invalid_proof = true;
		});
	}

}
