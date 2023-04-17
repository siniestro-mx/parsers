function parse(data, prop, i, event) {
  if ((!i || !data[i]) && prop !== "ReportIDAndType") return null;

  if (Number.isFinite(i)) {
    if (!data[i]) return null;
  }
  else if (typeof i === 'object' && !data[i.ID] && !data[i.Type]) {
    return null;
  }
  else {
    return null;
  }

  let y, m, d, h, mi, s, value = null;

  switch (prop) {
    case "ProtocolVersion":
      value = (parseInt(data[i].slice(2, 4), 16)) + (parseInt(data[i].slice(4, 6), 16) / 100.0);
      break;
    case "SendTime":
      y = parseInt(data[i].slice(0, 4), 10);
      m = parseInt(data[i].slice(4, 6), 10) - 1; // Menos uno porque Date.UTC toma el mes con base 0
      d = parseInt(data[i].slice(6, 8), 10);
      h = parseInt(data[i].slice(8, 10), 10);
      mi = parseInt(data[i].slice(10, 12), 10);
      s = parseInt(data[i].slice(12, 14), 10);

      value = Date.UTC(y, m, d, h, mi, s, 0) / 1000;

      break;
    case "SerialNumber":
      value = parseInt(data[i], 16);
      value = value.toString();
      while (value.length < 4) value = "0" + value;
      break;
    case "CountNumber":
      value = data[i].slice(0, (data[i].length - 1)); // Quitamos el tail character $
      value = parseInt(value, 16);
      break;
    case "HourMeterCount":
      var totalTime = data[i].split(':'),
        hours = parseInt(totalTime[0], 10),
        minutes = parseInt(totalTime[1], 10) / 60,
        seconds = parseInt(totalTime[2], 10) / 3600;

      value = hours + minutes + seconds;
      value = value.toFixed(2);
      value = (hours + (minutes / 60) + (seconds / 3600)).toFixed(2);
      if (value.length > 15) {
        console.log("Hour meter count raro");
        console.log(value);
        value = parseFloat(value);
        if (isNaN(value)) {
          value = 0;
        }
      }
      break;
    case "ReportIDAndType":
      let id = "";
      let type = "";
      switch (event) {
        case 'GTHBM':
        case 'GTDOG':
        case 'GTIOB':
        case 'GTDIS':
        case 'GTSOS':
        case 'GTFRI':
        case 'GTERI':
        case 'GTEPS':
        case 'GTAIS':
          id = data[i].slice(0, 1);
          type = data[i].slice(1, 2);
          value = id + "/" + type;
          break;
        case 'GTSPD':
        case 'GTIGL':
          type = data[i].slice(1, 2);
          value = "0/" + type;
          break;
        case 'GTOBD':
        case 'GTOSM':
        case 'GTCAN':
        case 'GTIDA':
          id = data[i.ID];
          type = data[i.Type];

          value = id + "/" + type;
          break;
        case 'GTRTL':
        case 'GTTOW':
          value = "0/0";
          break;
        case 'GTGEO':
        case 'GTGES':
          id = parseInt(data[i].slice(0, 1), 16);
          type = parseInt(data[i].slice(1, 2), 16);
          value = id + "/" + type;
          break;
        default:
          if (data[i] != "") {
            value = data[i];
          }
          break;
      }
      break;
    case "Latitude":
    case "Longitude":
      value = parseFloat(data[i]);
      break;
    case "Altitude":
    case "Speed":
    case "Mileage":
      value = Math.round(parseFloat(data[i]) * 100) / 100;
      break;
    case "Azimuth":
      value = parseInt(data[i], 10);
      break;
    case "GPSAccuracy":
      value = parseInt(data[i], 10);
      break;
    case "GPSUTCTime":
      y = parseInt(data[i].slice(0, 4), 10);
      m = parseInt(data[i].slice(4, 6), 10) - 1; // Menos uno porque Date.UTC toma el mes con base 0
      d = parseInt(data[i].slice(6, 8), 10);
      h = parseInt(data[i].slice(8, 10), 10);
      mi = parseInt(data[i].slice(10, 12), 10);
      s = parseInt(data[i].slice(12, 14), 10);
      value = Date.UTC(y, m, d, h, mi, s, 0) / 1000;
      break;
    case "BackupBatteryPercentage":
      value = parseInt(data[i], 10);
      break;
    case "IOStatus":
      let inputs = parseInt(data[i].slice(2, 4), 16).toString(2);
      let outputs = parseInt(data[i].slice(4, 6), 16).toString(2);

      while (inputs.length < 4) {
        inputs = "0" + inputs;
      }

      while (outputs.length < 3) {
        outputs = "0" + outputs;
      }

      if (data[1].slice(0, 2) === '3C' || data[1].slice(0, 2) === '41' || data[1].slice(0, 2) === '0F') {
        value = inputs + ',' + outputs + ',' + inputs.charAt(3) + ',' + outputs.charAt(1);
      }
      else {
        value = inputs + ',' + outputs + ',' + inputs.charAt(3) + ',' + outputs.charAt(0);
      }

      break;
    case "DeviceStatus":
      if (event == "GTFRI" || event == "GTERI") {
        value = data[i].slice(0, 2);
      }
      else if (event == "GTSTT") {
        value = data[i];
      }
      break;
    case "Temperature":
      if (i && i.constructor === Array) {
        value = [];
        i.forEach(function (sensor) {
          try {
            value.push({
              Id: data[sensor.Id],
              Type: data[sensor.Type],
              Value: data[sensor.Value] ? (new Buffer(data[sensor.Value], "hex").readInt16BE()) * 0.0625 : null
            });
          } catch (e) {
            console.log(e);
            console.log(value);
          }

        });
      }
      else if (i && i.constructor === Number) {
        value = (Buffer.from(data[i], "hex").readInt16BE()) * 0.0625;
      }
      break;
    case "GeoMode":
    case "Radius":
    case "CheckInterval":
      value = parseInt(data[i], 10);
      break;
    case "Analog1":
    case "Analog2":
      value = parseInt(data[i]);
      if (isFinite(value)) {
        value /= 1000;
        value = value.toFixed(2);
      }
      else {
        value = parseInt(data[i].substr(1));
        if (isFinite(value)) {
          value = value.toFixed(2);
        }
        else {
          value = 0;
        }
      }
      break;
    case "CSQRSSI":
      value = parseInt(data[i], 10);
      if (value === 0) {
        value = 'ATCSQ_NOSIGNAL';
      }
      else if (value == 1) {
        value = 'ATCSQ_WEAK';
      }
      else if (value >= 2 && value <= 9) {
        value = "ATCSQ_OK";
      }
      else if (value >= 10 && value <= 14) {
        value = "ATCSQ_GOOD";
      }
      else if (value >= 15 && value <= 19) {
        value = "ATCSQ_GREAT";
      }
      else if (value >= 20 && value <= 30) {
        value = "ATCSQ_EXCELLENT";
      }
      else {
        value = "ATCSQ_NOSIGNAL";
      }
      break;
    case "CSQBER":
      value = parseInt(data[i], 10);
      if (value == 0) {
        value = 0.14;
      }
      else if (value == 1) {
        value = 0.28;
      }
      else if (value == 2) {
        value = 0.57;
      }
      else if (value == 3) {
        value = 1.13;
      }
      else if (value == 4) {
        value = 2.26;
      }
      else if (value == 5) {
        value = 4.53;
      }
      else if (value == 6) {
        value = 9.05;
      }
      else if (value == 7) {
        value = 18.10;
      }
      break;
    case "ExternalPowerSupply":
      value = parseInt(data[i], 10);
      if (value > 32000) {
        value = 0;
      }
      else {
        value = value / 1000;
      }
      break;
    case "ExternalPowerVoltage":
      value = data[i] * 1;
      value = value / 1000;
      break;
    case "BackupBatteryVoltage":
      value = parseInt(data[i], 10);
      if (value > 100) {
        value = 100;
      }
      if (Number.isNaN(value)) {
        value = 0;
      }
      break;
    case "BackupBatteryPercentage":
      value = parseInt(data[i], 10);
      if (Number.isNaN(value)) {
        value = 0;
      }
      break;
    case "LastFixUTCTime":
      y = parseInt(data[i].slice(0, 4), 10);
      m = parseInt(data[i].slice(4, 6), 10) - 1; // Menos uno porque Date.UTC toma el mes con base 0
      d = parseInt(data[i].slice(6, 8), 10);
      h = parseInt(data[i].slice(8, 10), 10);
      mi = parseInt(data[i].slice(10, 12), 10);
      s = parseInt(data[i].slice(12, 14), 10);
      value = Date.UTC(y, m, d, h, mi, s, 0) / 1000;
      break;
    case "EngineCoolantTemperature":
    case "DTCsClaredDistance":
    case "MILActivatedDistance":
    case "MILStatus":
    case "NumberDTCs":
    case "ThrottlePosition":
    case "EngineLoad":
    case "EngineRPM":
    case "FuelLevel":
      value = Math.round(parseFloat(data[i], 10) * 100) / 100;
      if (isNaN(value)) {
        value = 0;
      }
      break;
    case "HourMeterCount":
      try {
        let totalTime = data[i].split(':');
        let hours = parseInt(totalTime[0], 10);
        let minutes = parseInt(totalTime[1], 10) / 60;
        let seconds = parseInt(totalTime[2], 10) / 3600;

        value = hours + minutes + seconds;
        value = value.toFixed(2);
        value = (hours + (minutes / 60) + (seconds / 3600)).toFixed(2);
        if (value.length > 15) {
          console.log("Hour meter count raro");
          console.log(value);
          value = parseFloat(value);
          if (isNaN(value)) {
            value = 0;
          }
        }
      } catch (e) {
        console.log(e);
        value = 0;
      }
      break;
    case "DigitalInput":
    case "DigitalOutput":
      value = parseInt(data[i], 16);
      if (isFinite(value)) {
        value = value.toString(2);
      }
      else {
        value = null;
      }
      break;
    case "TotalFuelUsed":
    case "EngineRPM":
    case "TotalVehicleOverspeedTime":
    case "TotalVehicleEngineOverspeedTime":
    case "VehicleSpeed":
    case "EngineCoolantTemperature":
    case "ThrottlePosition":
    case "TotalEngineHours":
    case "TotalDrivingTime":
    case "TotalEngineIdleTime":
    case "TotalIdleFuelUsed":
    case "Range":
      value = parseFloat(data[i]);
      if (!Number.isFinite(value)) {
        value = null;
      }
      break;
    default:
      value = data[i];
  }

  if (!value && value !== 0) {
    return null;
  }

  return value;
}

module.exports = parse;
