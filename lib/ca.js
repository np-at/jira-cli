"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = __importDefault(require("./settings"));
const fs_1 = require("fs");
exports.default = () => {
    return fs_1.readFileSync(settings_1.default.getCertificateFilePath());
};
