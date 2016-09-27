/**
 * @fileoverview
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

goog.exportSymbol('proto.FullUpdate', null, global);
goog.exportSymbol('proto.Mapping', null, global);

/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.FullUpdate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.FullUpdate.repeatedFields_, null);
};
goog.inherits(proto.FullUpdate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.FullUpdate.displayName = 'proto.FullUpdate';
}
/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.FullUpdate.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.FullUpdate.prototype.toObject = function(opt_includeInstance) {
  return proto.FullUpdate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.FullUpdate} msg The msg instance to transform.
 * @return {!Object}
 */
proto.FullUpdate.toObject = function(includeInstance, msg) {
  var f, obj = {
    fromer: msg.getFromer(),
    mappingsList: jspb.Message.toObjectList(msg.getMappingsList(),
    proto.Mapping.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.FullUpdate}
 */
proto.FullUpdate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.FullUpdate;
  return proto.FullUpdate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.FullUpdate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.FullUpdate}
 */
proto.FullUpdate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setFromer(value);
      break;
    case 1:
      var value = new proto.Mapping;
      reader.readMessage(value,proto.Mapping.deserializeBinaryFromReader);
      msg.getMappingsList().push(value);
      msg.setMappingsList(msg.getMappingsList());
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Class method variant: serializes the given message to binary data
 * (in protobuf wire format), writing to the given BinaryWriter.
 * @param {!proto.FullUpdate} message
 * @param {!jspb.BinaryWriter} writer
 */
proto.FullUpdate.serializeBinaryToWriter = function(message, writer) {
  message.serializeBinaryToWriter(writer);
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.FullUpdate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  this.serializeBinaryToWriter(writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the message to binary data (in protobuf wire format),
 * writing to the given BinaryWriter.
 * @param {!jspb.BinaryWriter} writer
 */
proto.FullUpdate.prototype.serializeBinaryToWriter = function (writer) {
  var f = undefined;
  f = this.getFromer();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = this.getMappingsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.Mapping.serializeBinaryToWriter
    );
  }
};


/**
 * Creates a deep clone of this proto. No data is shared with the original.
 * @return {!proto.FullUpdate} The clone.
 */
proto.FullUpdate.prototype.cloneMessage = function() {
  return /** @type {!proto.FullUpdate} */ (jspb.Message.cloneMessage(this));
};


/**
 * optional string fromer = 3;
 * @return {string}
 */
proto.FullUpdate.prototype.getFromer = function() {
  return /** @type {string} */ (jspb.Message.getFieldProto3(this, 3, ""));
};


/** @param {string} value  */
proto.FullUpdate.prototype.setFromer = function(value) {
  jspb.Message.setField(this, 3, value);
};


/**
 * repeated Mapping mappings = 1;
 * If you change this array by adding, removing or replacing elements, or if you
 * replace the array itself, then you must call the setter to update it.
 * @return {!Array.<!proto.Mapping>}
 */
proto.FullUpdate.prototype.getMappingsList = function() {
  return /** @type{!Array.<!proto.Mapping>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.Mapping, 1));
};


/** @param {Array.<!proto.Mapping>} value  */
proto.FullUpdate.prototype.setMappingsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


proto.FullUpdate.prototype.clearMappingsList = function() {
  this.setMappingsList([]);
};



/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.Mapping = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.Mapping.repeatedFields_, null);
};
goog.inherits(proto.Mapping, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.Mapping.displayName = 'proto.Mapping';
}
/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.Mapping.repeatedFields_ = [2,4,3,5];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.Mapping.prototype.toObject = function(opt_includeInstance) {
  return proto.Mapping.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.Mapping} msg The msg instance to transform.
 * @return {!Object}
 */
proto.Mapping.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: msg.getName(),
    idsList: jspb.Message.getField(msg, 2),
    idsEpochList: jspb.Message.getField(msg, 4),
    deletedList: jspb.Message.getField(msg, 3),
    delEpochList: jspb.Message.getField(msg, 5)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.Mapping}
 */
proto.Mapping.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.Mapping;
  return proto.Mapping.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.Mapping} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.Mapping}
 */
proto.Mapping.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.getIdsList().push(value);
      msg.setIdsList(msg.getIdsList());
      break;
    case 4:
      var value = /** @type {!Array.<number>} */ (reader.readPackedInt32());
      msg.setIdsEpochList(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.getDeletedList().push(value);
      msg.setDeletedList(msg.getDeletedList());
      break;
    case 5:
      var value = /** @type {!Array.<number>} */ (reader.readPackedInt32());
      msg.setDelEpochList(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Class method variant: serializes the given message to binary data
 * (in protobuf wire format), writing to the given BinaryWriter.
 * @param {!proto.Mapping} message
 * @param {!jspb.BinaryWriter} writer
 */
proto.Mapping.serializeBinaryToWriter = function(message, writer) {
  message.serializeBinaryToWriter(writer);
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.Mapping.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  this.serializeBinaryToWriter(writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the message to binary data (in protobuf wire format),
 * writing to the given BinaryWriter.
 * @param {!jspb.BinaryWriter} writer
 */
proto.Mapping.prototype.serializeBinaryToWriter = function (writer) {
  var f = undefined;
  f = this.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = this.getIdsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = this.getIdsEpochList();
  if (f.length > 0) {
    writer.writePackedInt32(
      4,
      f
    );
  }
  f = this.getDeletedList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
  f = this.getDelEpochList();
  if (f.length > 0) {
    writer.writePackedInt32(
      5,
      f
    );
  }
};


/**
 * Creates a deep clone of this proto. No data is shared with the original.
 * @return {!proto.Mapping} The clone.
 */
proto.Mapping.prototype.cloneMessage = function() {
  return /** @type {!proto.Mapping} */ (jspb.Message.cloneMessage(this));
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.Mapping.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldProto3(this, 1, ""));
};


/** @param {string} value  */
proto.Mapping.prototype.setName = function(value) {
  jspb.Message.setField(this, 1, value);
};


/**
 * repeated string ids = 2;
 * If you change this array by adding, removing or replacing elements, or if you
 * replace the array itself, then you must call the setter to update it.
 * @return {!Array.<string>}
 */
proto.Mapping.prototype.getIdsList = function() {
  return /** @type {!Array.<string>} */ (jspb.Message.getField(this, 2));
};


/** @param {Array.<string>} value  */
proto.Mapping.prototype.setIdsList = function(value) {
  jspb.Message.setField(this, 2, value || []);
};


proto.Mapping.prototype.clearIdsList = function() {
  jspb.Message.setField(this, 2, []);
};


/**
 * repeated int32 ids_epoch = 4;
 * If you change this array by adding, removing or replacing elements, or if you
 * replace the array itself, then you must call the setter to update it.
 * @return {!Array.<number>}
 */
proto.Mapping.prototype.getIdsEpochList = function() {
  return /** @type {!Array.<number>} */ (jspb.Message.getField(this, 4));
};


/** @param {Array.<number>} value  */
proto.Mapping.prototype.setIdsEpochList = function(value) {
  jspb.Message.setField(this, 4, value || []);
};


proto.Mapping.prototype.clearIdsEpochList = function() {
  jspb.Message.setField(this, 4, []);
};


/**
 * repeated string deleted = 3;
 * If you change this array by adding, removing or replacing elements, or if you
 * replace the array itself, then you must call the setter to update it.
 * @return {!Array.<string>}
 */
proto.Mapping.prototype.getDeletedList = function() {
  return /** @type {!Array.<string>} */ (jspb.Message.getField(this, 3));
};


/** @param {Array.<string>} value  */
proto.Mapping.prototype.setDeletedList = function(value) {
  jspb.Message.setField(this, 3, value || []);
};


proto.Mapping.prototype.clearDeletedList = function() {
  jspb.Message.setField(this, 3, []);
};


/**
 * repeated int32 del_epoch = 5;
 * If you change this array by adding, removing or replacing elements, or if you
 * replace the array itself, then you must call the setter to update it.
 * @return {!Array.<number>}
 */
proto.Mapping.prototype.getDelEpochList = function() {
  return /** @type {!Array.<number>} */ (jspb.Message.getField(this, 5));
};


/** @param {Array.<number>} value  */
proto.Mapping.prototype.setDelEpochList = function(value) {
  jspb.Message.setField(this, 5, value || []);
};


proto.Mapping.prototype.clearDelEpochList = function() {
  jspb.Message.setField(this, 5, []);
};


goog.object.extend(exports, proto);
