import { Component } from '@angular/core';
import { ReportViewer } from './report-viewer';
import { DEPARTMENTS, validateReportUrl } from './catalog';
@Component({ selector: 'app-root', templateUrl: './app.html', imports: [ReportViewer] })
export class App {
  readonly departments = DEPARTMENTS;
  readonly availableDepartments = DEPARTMENTS.filter((area) => area.reports.length).length;
  home = true;
  search = '';
  get filteredDepartments() {
    const query = this.search.trim().toLocaleLowerCase('es');
    return this.departments
      .map((area) => ({
        ...area,
        reports: area.reports.filter((report) =>
          (area.name + ' ' + report.title + ' ' + report.description)
            .toLocaleLowerCase('es')
            .includes(query),
        ),
      }))
      .filter(
        (area) =>
          area.reports.length ||
          (!this.departments.find((d) => d.id === area.id)!.reports.length &&
            area.name.toLocaleLowerCase('es').includes(query)),
      );
  }
  showHome() {
    this.home = true;
  }
  department = DEPARTMENTS[0];
  report = this.department.reports[0];
  url = validateReportUrl(this.report.publicEmbedUrl);

  message = '';
  selectReport(departmentId: string, reportId: string) {
    const department = this.departments.find((d) => d.id === departmentId);
    const report = department?.reports.find((r) => r.id === reportId);
    if (!department || !report) return;
    this.home = false;
    if (report === this.report) return;
    const url = validateReportUrl(report.publicEmbedUrl);
    this.message = '';
    this.department = department;
    this.report = report;
    this.url = url;
  }
}
