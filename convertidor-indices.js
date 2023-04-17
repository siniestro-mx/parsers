const Messages = {
  Default: [{
    Formats: ['GTFRI', 'GTGEO', 'GTSPD', 'GTSOS', 'GTRTL', 'GTPNL', 'GTNMR', 'GTDIS', 'GTDOG', 'GTIGL', 'GTPFL', 'GTLBC', 'GTGCR', 'GTINF',
      'GTGPS', 'GTCID', 'GTVER', 'GTBAT', 'GTGSV', 'GTPNA', 'GTPFA', 'GTPDP', 'GTGSM', 'GTUPC', 'GTDAT'
    ],
    Index: {
      ProtocolVersion: 1,
      UniqueID: 2,
      DeviceName: 3,
      SendTime: 20,
      CountNumber: 21
    },
    Special: {
      'GTLBC': {
        SendTime: 18,
        CountNumber: 19
      },
      'GTGCR': {
        SendTime: 20,
        CountNumber: 21
      },
      'GTINF': {
        SendTime: 23,
        CountNumber: 24
      },
      'GTGPS': {
        SendTime: 11,
        CountNumber: 12
      },
      'GTCID': {
        SendTime: 5,
        CountNumber: 6
      },
      'GTVER': {
        SendTime: 7,
        CountNumber: 8
      },
      'GTBAT': {
        SendTime: 10,
        CountNumber: 11
      },
      'GTGSV': {
        SendTime: 14,
        CountNumber: 15
      },
      'GTGSM': {
        DeviceName: null,
        SendTime: 46,
        CountNumber: 47
      },
      'GTUPC': {
        SendTime: 8,
        CountNumber: 9
      },
      'GTDAT': {
        SendTime: 5,
        CountNumber: 6
      },
      'GTDAT': {
        SendTime: 24,
        CountNumber: 25
      },
    }
  }, {
    Formats: ['GTBPL', 'GTSTC', 'GTSTT', 'GTANT', 'GTSWG', 'GTIGN', 'GTIGF', 'GTJDS'],
    Index: {
      ProtocolVersion: 1,
      UniqueID: 2,
      DeviceName: 3,
      SendTime: 17,
      CountNumber: 18
    },
    Special: null
  }, {
    Formats: ['GTEPN', 'GTEPF', 'GTBTC', 'GTROF', 'GTRON', 'GTJDR'],
    Index: {
      ProtocolVersion: 1,
      UniqueID: 2,
      DeviceName: 3,
      SendTime: 16,
      CountNumber: 17
    },
    Special: null
  }, {
    Formats: ['GTPNA', 'GTPFA', 'GTPDP'],
    Index: {
      ProtocolVersion: 1,
      UniqueID: 2,
      DeviceName: 3,
      SendTime: 4,
      CountNumber: 5
    },
    Special: null
  }, {
    Formats: ['GTCSQ', 'GTTMZ'],
    Index: {
      ProtocolVersion: 1,
      UniqueID: 2,
      DeviceName: 3,
      SendTime: 6,
      CountNumber: 7
    },
    Special: null
  }],
  Base: [{
    Formats: ['GTFRI', 'GTGEO', 'GTSPD', 'GTSOS', 'GTRTL', 'GTPNL', 'GTNMR', 'GTDIS', 'GTDOG', 'GTIGL', 'GTPFL', 'GTGCR',
      'GTDAT', 'GTEPN', 'GTEPF', 'GTBTC', 'GTJDR', 'GTROF', 'GTRON', 'GTLBC', 'GTBPL', 'GTSTC', 'GTSTT', 'GTANT',
      'GTSWG', 'GTIGN', 'GTIGF', 'GTJDS'
    ],
    Index: {
      ReportIDAppendMask: 4,
      ReportType: 5,
      Latitude: 12,
      Longitude: 11,
      Altitude: 10,
      Azimuth: 9,
      Mileage: 18,
      Speed: 8
    },
    Special: {
      'GTGCR': {
        ReportIDAppendMask: null,
        ReportType: null
      },
      'GTDAT': {
        ReportIDAppendMask: null,
        ReportType: null,
        Latitude: 13,
        Longitude: 12,
        Altitude: 11,
        Azimuth: 10,
        Mileage: null,
        Speed: 9
      },
    }
  }, {
    Formats: ['GTEPN', 'GTEPF', 'GTBTC', 'GTJDR', 'GTROF', 'GTRON'],
    Index: {
      ReportIDAppendMask: null,
      ReportType: null,
      Latitude: 9,
      Longitude: 8,
      Altitude: 7,
      Azimuth: 6,
      Mileage: 15,
      Speed: 5
    },
    Special: {
      'GTJDR': {
        Mileage: null
      },
    }
  }, {
    Formats: ['GTLBC', 'GTBPL', 'GTSTC', 'GTSTT', 'GTANT', 'GTSWG', 'GTIGN', 'GTIGF', 'GTJDS'],
    Index: {
      ReportIDAppendMask: null,
      ReportType: null,
      Latitude: 10,
      Longitude: 9,
      Altitude: 8,
      Azimuth: 7,
      Mileage: 16,
      Speed: 6
    },
    Special: {
      'GTJDS': {
        Mileage: null
      },
    }
  }, ],
  Extended: [{
    Formats: ['GTFRI', 'GTGEO', 'GTSPD', 'GTSOS', 'GTRTL', 'GTPNL', 'GTNMR', 'GTDIS', 'GTDOG', 'GTIGL', 'GTPFL', 'GTGCR',
      'GTINF', 'GTGPS', 'GTBAT', 'GTDAT', 'GTEPN', 'GTEPF', 'GTBTC', 'GTJDR', 'GTROF', 'GTRON', 'GTLBC', 'GTBPL',
      'GTSTC', 'GTSTT', 'GTANT', 'GTSWG', 'GTIGN', 'GTIGF', 'GTJDS'
    ],
    Index: {
      GPSAccuracy: 7,
      GPSUTCTime: 13,
      BackupBatteryPercentage: 19
    },
    Special: {
      'GTGCR': {
        BackupBatteryPercentage: null
      },
      'GTINF': {
        GPSAccuracy: null,
        GPSUTCTime: 17,
        BackupBatteryPercentage: 18,
        ExternalPowerSupply: 8
      },
      'GTGPS': {
        GPSAccuracy: null,
        GPSUTCTime: 10,
        BackupBatteryPercentage: null
      },
      'GTBAT': {
        GPSAccuracy: null,
        GPSUTCTime: null,
        BackupBatteryPercentage: 6,
        ExternalPowerSupply: 4
      },
      'GTDAT': {
        GPSAccuracy: 8,
        GPSUTCTime: 14,
        BackupBatteryPercentage: null
      },
    }
  }, {
    Formats: ['GTEPN', 'GTEPF', 'GTBTC', 'GTJDR', 'GTROF', 'GTRON'],
    Index: {
      GPSAccuracy: 4,
      GPSUTCTime: 10,
      BackupBatteryPercentage: null
    },
    Special: null
  }, {
    Formats: ['GTLBC', 'GTBPL', 'GTSTC', 'GTSTT', 'GTANT', 'GTSWG', 'GTIGN', 'GTIGF', 'GTJDS'],
    Index: {
      GPSAccuracy: 5,
      GPSUTCTime: 11,
      BackupBatteryPercentage: null
    },
    Special: {
      'GTLBC': {
        CallNumber: 4
      },
    }
  }],
  Geofence: [{
    Formats: ['GTGCR'],
    Index: {
      GeoMode: 4,
      GeoRadius: 5,
      GeoCheckInterval: 6
    },
    Special: null
  }],
  GSMNetwork: [{
    Formats: ['GTFRI', 'GTGEO', 'GTSPD', 'GTSOS', 'GTRTL', 'GTPNL', 'GTNMR', 'GTDIS', 'GTDOG', 'GTIGL', 'GTPFL', 'GTGCR', 'GTGSM',
      'GTDAT', 'GTLBC', 'GTBPL', 'GTSTC', 'GTSTT', 'GTANT', 'GTSWG', 'GTIGN', 'GTIGF', 'GTJDS', 'GTEPN', 'GTEPF', 'GTBTC',
      'GTJDR', 'GTROF', 'GTRON'
    ],
    Index: {
      MCC: 14,
      MNC: 15,
      LAC: 16,
      CellID: 17
    },
    Special: {
      'GTGSM': {
        MCC: 40,
        MNC: 41,
        LAC: 42,
        CellID: 43,
        RxLevel: 44,
        MCC1: 4,
        MNC1: 5,
        LAC1: 6,
        CellID1: 7,
        RxLevel1: 8,
        MCC2: 10,
        MNC2: 11,
        LAC2: 12,
        CellID2: 13,
        RxLevel2: 14,
        MCC3: 16,
        MNC3: 17,
        LAC3: 18,
        CellID3: 19,
        RxLevel3: 20,
        MCC4: 22,
        MNC4: 23,
        LAC4: 24,
        CellID4: 25,
        RxLevel4: 26,
        MCC5: 28,
        MNC5: 29,
        LAC5: 30,
        CellID5: 31,
        RxLevel5: 32,
        MCC6: 34,
        MNC6: 35,
        LAC6: 36,
        CellID6: 37,
        RxLevel6: 38,
        FixType: 3
      },
      'GTDAT': {
        MCC: 15,
        MNC: 16,
        LAC: 17,
        CellID: 18
      },
    }
  }, {
    Formats: ['GTLBC', 'GTBPL', 'GTSTC', 'GTSTT', 'GTANT', 'GTSWG', 'GTIGN', 'GTIGF', 'GTJDS'],
    Index: {
      MCC: 12,
      MNC: 13,
      LAC: 14,
      CellID: 15
    },
    Special: null
  }, {
    Formats: ['GTEPN', 'GTEPF', 'GTBTC', 'GTJDR', 'GTROF', 'GTRON'],
    Index: {
      MCC: 11,
      MNC: 12,
      LAC: 13,
      CellID: 14
    },
    Special: null
  }],
  Info: [{
    Formats: ['GTINF', 'GTGPS', 'GTCID', 'GTCSQ', 'GTVER', 'GTBAT', 'GTTMZ', 'GTGSV', 'GTIGN', 'GTIGF', 'GTUPC', 'GTJDS', 'GTDAT'],
    Index: {},
    Special: {
      'GTINF': {
        ICCID: 5,
        CSQRSSI: 6,
        CSQBER: 7,
        ExternalPowerSupply: 8,
        BatteryVoltage: 11,
        Charging: 12,
        LEDOn: 13,
        GPSOnNeed: 14,
        GPSAntennaType: 15,
        GPSAntennaState: 16,
        LastFixUTCTime: 17,
        FlashType: 19,
        LockState: 20
      },
      'GTGPS': {
        GPSOnNeed: 4,
        GPSFixDelay: 5,
        GPSAntennaType: 6,
        GPSAntennaState: 9,
        LastFixUTCTime: 10,
        ReportItemsMask: 7,
        FRIReportMask: 8
      },
      'GTCID': {
        ICCID: 4
      },
      'GTCSQ': {
        CSQRSSI: 4,
        CSQBER: 5
      },
      'GTVER': {
        DeviceType: 4,
        FirmwareVersion: 5,
        HardwareVersion: 6
      },
      'GTBAT': {
        ExternalPowerSupply: 4,
        BatteryVoltage: 7,
        Charging: 8,
        LEDOn: 9
      },
      'GTTMZ': {
        TimeZoneOffset: 4,
        DaylightSaving: 5
      },
      'GTGSV': {
        JammingIndicator: 5,
        GPSLevel: 4,
        SVCount: 6,
        SVId: 7,
        SVPower: 8,
      },
      'GTIGN': {
        DurationOfIgnitionOff: 4
      },
      'GTIGF': {
        DurationOfIgnitionOn: 4
      },
      'GTUPC': {
        CommandID: 4,
        Result: 5,
        DownloadURL: 6
      },
      'GTJDS': {
        JammingStatus: 4
      },
      'GTDAT': {
        Data: 7
      },
    }
  }],
  Config: [],
};
const Formats = {};

const Acknowledgement = {
  Events: ['GTQSS', 'GTBSI', 'GTSRI', 'GTCFG', 'GTNMD', 'GTTMA', 'GTFRI', 'GTSPD', 'GTFKS', 'GTWLT', 'GTGLM', 'GTPIN', 'GTOUT', 'GTDIS',
    'GTDOG', 'GTSFM', 'GTDAT', 'GTNTS', 'GTOWH', 'GTCMD', 'GTUDF', 'GTUPC', 'GTJDC', 'GTPDS', 'GTGEO', 'GTRTO'
  ],
  Index: {
    ProtocolVersion: 1,
    UniqueID: 2,
    DeviceName: 3,
    SerialNumber: 4,
    SendTime: 5,
    CountNumber: 6
  },
  Special: {
    'GTGEO': {
      GEOID: 4,
      SerialNumber: 5,
      SendTime: 6,
      CountNumber: 7
    },
    'GTRTO': {
      SubCommand: 4,
      SerialNumber: 5,
      SendTime: 6,
      CountNumber: 7
    },
  }
}
let eventsIndex = {'acknowledgment': {}, 'report':{}};

/* reports index */
for (let msg in Messages) {
  let groups = Messages[msg];

  groups.forEach((group) => {
    let events = group.Formats;

    events.forEach((event) => {
      if (!eventsIndex.report[event]) {
        eventsIndex.report[event] = JSON.parse(JSON.stringify(group.Index));
      }
      else {
        for (let prop in group.Index) {
          eventsIndex.report[event][prop] = group.Index[prop];
        }
      }
    });

    if (group.Special) {
      for (let event in group.Special) {
        if (events.includes(event)) {
          for (let prop in group.Special[event]) {
            eventsIndex.report[event][prop] = group.Special[event][prop];
          }
        }
      }
    }
  });
}

for (let event in Formats) {
  eventsIndex.report[event] = JSON.parse(JSON.stringify(Formats[event]));
}

/* acknowledgments index */
Acknowledgement.Events.forEach((event) => {
  eventsIndex.acknowledgment[event] = JSON.parse(JSON.stringify(Acknowledgement.Index))
});
 
for (let event in Acknowledgement.Special) {
  for (let prop in Acknowledgement.Special[event]) {
    eventsIndex.acknowledgment[event][prop] = Acknowledgement.Special[event][prop];
  }
}

/*escribir el resultado en un archivo llamado index.js */
const fs = require('fs');
fs.writeFile('index.js', JSON.stringify(eventsIndex, null, 2), (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});