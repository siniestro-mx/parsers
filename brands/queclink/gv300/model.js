const mongoose = require('mongoose');

const Gv300Schema = new mongoose.Schema({
  ProtocolVersion: {
    type: Number,
    required: true
  },
  UniqueID: {
    type: String,
    required: true
  },
  DeviceName: {
    type: String,
  },
  SendTime: {
    type: Date,
    required: true
  },
  CountNumber: {
    type: Number,
    required: true
  },
  ReportIDAndType: {
    type: String,
  },
  Latitude: {
    type: Number,
  },
  Longitude: {
    type: Number,
  },
  Altitude: {
    type: Number,
  },
  Speed: {
    type: Number,
  },
  Azimuth: {
    type: Number,
  },
  Mileage: {
    type: Number,
  },
  GPSAccuracy: {
    type: Number,
  },
  GPSUTCTime: {
    type: Date,
  },
  IOStatus: {
    type: String,
  },
  DeviceStatus: {
    type: String,
  },
  BackupBatteryPercentage: {
    type: Number,
  },
  MCC: {
    type: String,
  },
  MNC: {
    type: String,
  },
  LAC: {
    type: String,
  },
  CellID: {
    type: String,
  },
  HourMeterCount: {
    type: Number,
  },
  valid: {
    type: Boolean,
  },
  received_at: {
    type: Number,
  },
  Engine: {
    type: String,
  },
  EngineLock: {
    type: String,
  },
  Address: {
    type: String,
  },
  City: {
    type: String,
  },
  State: {
    type: String,
  },
  Country: {
    type: String,
  },
  MessageType: {
    type: String,
  },
  DeviceType: {
    type: String,
  },
  DeviceBrand: {
    type: String,
  },
  Event: {
    type: String,
  },
  is_valid: {
    type: Boolean,
  },
  valid_position: {
    type: Boolean,
  }
},{
  timestamps: false,
  collection: "gpsHistories",
  timeseries: {
    timeField: "SendTime",
    metaField: null, // Opcional: especifica el campo de metadatos si es necesario
    granularity: "seconds", // Opcional: segundos, minutos, horas, etc.
  },
  strict: false
});

const Gv300Model = mongoose.model('GpsHistory', Gv300Schema);

module.exports = Gv300Model;
