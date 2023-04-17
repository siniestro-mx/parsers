const DEVICE_MODELS = require('./device_models.js');
const parse = require('./parser.js');
const device_index = require('./index.js');
/*  cambiar DeviceModel por el nombre actual del modelo que se va a implementar con esta plantilla. No debe utilizarse esta plantilla directamente sin modificar */
class DeviceModel {
  /*  se declaran las propiedades del objeto:
  *     data: objeto con los datos del paquete
  *     msg_type: tipo de mensaje: report, command, acknowledgment, config, buffer
  *     firmware: version del firmware
  *     model: modelo del dispositivo
  *     brand: marca del dispositivo
  *     event: evento del paquete, lo que generó el dispositivo gps enviara el paquete
  *     valid_position: indica si el paquete tiene una posicion válida
  *     is_valid: indica si el paquete es válido
  *     raw_data: datos del paquete en bruto
  *     error: error en el paquete
  */
  data = {};
  msg_type = null;
  firmware = null;
  model = '';
  brand = "";
  event = null;
  valid_position = false;
  is_valid = false;
  raw_data = null;
  error = null;

  constructor(data, socket_info) {

  }

  getMsgType() {
    return this.msg_type;
  }

  getEvent() {
    return this.event;
  }

  getModel() {
    return this.model;
  }

  getBrand() {
    return this.brand;
  }

  hasValidPosition() {
    return this.valid_position;
  }

  isValid() {
    return this.is_valid;
  }

  getId() {
    return this.data.UniqueID;
  }

  getData() {
    return this.data;
  }

  static getIdFromRawData(data) {

  }

  static #parseAcknowledgement(data, socket_info, me) {
  }

  static #parseReport(data, socket_info, me) {}



  static #parse(data, socket_info, me) {
    const msg_type = me.msg_type;

    switch (msg_type) {
      case "acknowledgment":
        return DeviceModel.#parseAcknowledgement(data, socket_info, me);
      case "report":
      case "buffer":
        return DeviceModel.#parseReport(data, socket_info, me);
      default:
        return { valid: false };

    }
  }
}

module.exports = Gv300;