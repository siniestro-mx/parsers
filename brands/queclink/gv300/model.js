const mongoose = require('mongoose');
const schemaObject = {
  ProtocolVersion: {
    type: Number
  },
  UniqueID: {
    type: String,
    required: true
  },
  Alias: {
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
  Latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  Longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  Altitude: {
    type: Number,
  },
  Speed: {
    type: Number
  },
  Azimuth: {
    type: Number,
    min: 0,
    max: 360
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
  Inputs: {
    type: String,
  },
  Outputs: {
    type: String,
  },
  BackupBatteryPercentage: {
    type: Number,
    max: 100
  },
  MCC: {
    type: String
  },
  MNC: {
    type: String
  },
  LAC: {
    type: String
  },
  CellID: {
    type: String
  },
  HourMeterCount: {
    type: Number,
  },
  ReceivedAt: {
    type: Date,
  },
  Engine: {
    type: Boolean,
  },
  EngineLock: {
    type: Boolean,
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
  Model: {
    type: String,
    required: true
  },
  Brand: {
    type: String,
    required: true
  },
  Event: {
    type: String,
    required: true
  },
  IsValid: {
    type: Boolean,
    required: true
  },
  ValidPosition: {
    type: Boolean,
    required: true
  }
};
const overlayObject = {
  name: String,
  category: String,
  checked: Boolean,
  owner: String,
  clientcategories: [String],
  type: String,
  fillColor: String,
  strokeColor: String,
  strokeOpacity: Number,
  fillOpacity: Number,
  strokeWeight: Number,
  vehicles: [String],
  unitsInOverlay: Array,
  tolerance: Number,
  icon: String,
  poiIcon: String,
  radius: {
    type: Number,
    validate: {
      validator: function (v) {
        // validación personalizada
        return this.overlay.type === 'Point' ? v !== null : true;
      },
      message: props => 'El radio es necesario cuando el tipo es Punto.'
    }
  },
  overlay: {
    type: {
      type: String,
      enum: ['Point', 'LineString', 'Polygon'],
      required: true
    },
    coordinates: {
      type: [],
      required: true
    }
  },
  overlayPolygon: {
    type: {
      type: String,
      enum: ['Polygon']
    },
    coordinates: {
      type: []
    }
  }
};

const OverlaySchema = new mongoose.Schema(overlayObject, {
  collection: 'overlays',
  strict: false
});

const HistorySchema = new mongoose.Schema(schemaObject, {
  timestamps: false,
  collection: "gpsHistories",
  timeseries: {
    timeField: "SendTime",
    metaField: null,
    granularity: "seconds",
  },
  strict: false
});

const CacheSchema = new mongoose.Schema(Object.assign({
  Position: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  Overlays: {
    type: Array
  },
}, schemaObject), {
  timestamps: false,
  collection: "unitsCache",
  strict: false
});

const HistoryModel = mongoose.model('GpsHistory', HistorySchema);
const CacheModel = mongoose.model('GpsCache', CacheSchema);
const Overlay = mongoose.model('Overlay', OverlaySchema);

module.exports = {
  HistoryModel,
  CacheModel,
  Overlay
};