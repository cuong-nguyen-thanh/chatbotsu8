class SlackModel {
    constructor(application_id, employee_external_code, approverId, application_form_id, app_id, tenant_id) {
      this._application_id = application_id;
      this._employee_external_code = employee_external_code;
      this._approverId = approverId;
      this._application_form_id = application_form_id;
      this._app_id = app_id;
      this._tenant_id = tenant_id;
    }
    get application_id() {
      return this._application_id;
    }
    get employee_external_code() {
        return this._employee_external_code;
    }
    get approverId() {
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
  }
  module.exports = SlackModel;
