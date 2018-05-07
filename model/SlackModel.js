class SlackModel {
    constructor(application_id, employee_external_code, approverId, application_form_id, app_id, tenant_id, update_time) {
      this._application_id = application_id;
      this._employee_external_code = employee_external_code;
      this._approverId = approverId;
      this._application_form_id = application_form_id;
      this._app_id = app_id;
      this._tenant_id = tenant_id;
      this._update_time = update_time;
    }
    get application_id() {
      return this._application_id;
    }
    get employee_external_code() {
        return this._employee_external_code;
    }
    get approver_id() {
    return this._approverId;
    }
    get application_form_id() {
        return this._application_form_id;
    }
    get app_id() {
        return this._app_id;
    }
    get tenant_id() {
    return this._tenant_id;
    }
    get update_time() {
      return this._update_time;
    }
}
  module.exports = SlackModel;
