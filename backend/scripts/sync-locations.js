"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var node_fetch_1 = __importDefault(require("node-fetch"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var prisma = new client_1.PrismaClient();
function syncLocations() {
    return __awaiter(this, void 0, void 0, function () {
        var response, treeData, existingLocations, existingMap, _i, existingLocations_1, loc, addedProvinces, addedDistricts, addedWards, provinceIdMap, districtIdMap, _a, _b, pCode, pData, pName, pId, check, pRecord, districts, _loop_1, _c, _d, dCode, oldWardsPath, oldWardsStr, oldWardsData, addedOldWards, _e, oldWardsData_1, oldWard, pId, ngh, dRecord, wId, checkOld, error_1;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log('=== START SYNCING LOCATIONS ===');
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 27, 28, 30]);
                    // 1. Fetch data from hanhchinhvn
                    console.log('Fetching standard location data...');
                    return [4 /*yield*/, (0, node_fetch_1.default)('https://raw.githubusercontent.com/madnh/hanhchinhvn/master/dist/tree.json')];
                case 2:
                    response = _f.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch data: ".concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    treeData = _f.sent();
                    return [4 /*yield*/, prisma.location.findMany()];
                case 4:
                    existingLocations = _f.sent();
                    existingMap = new Map();
                    for (_i = 0, existingLocations_1 = existingLocations; _i < existingLocations_1.length; _i++) {
                        loc = existingLocations_1[_i];
                        existingMap.set("".concat(loc.name.toLowerCase(), "-").concat(loc.type, "-").concat(loc.parentId || ''), loc.id);
                    }
                    addedProvinces = 0;
                    addedDistricts = 0;
                    addedWards = 0;
                    provinceIdMap = new Map();
                    districtIdMap = new Map();
                    _a = 0, _b = Object.keys(treeData);
                    _f.label = 5;
                case 5:
                    if (!(_a < _b.length)) return [3 /*break*/, 14];
                    pCode = _b[_a];
                    pData = treeData[pCode];
                    pName = pData.name_with_type;
                    pId = existingMap.get("".concat(pName.toLowerCase(), "-CITY-")) || existingMap.get("".concat(pName.toLowerCase(), "-PROVINCE-"));
                    if (!!pId) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.location.findFirst({ where: { name: pName } })];
                case 6:
                    check = _f.sent();
                    if (!check) return [3 /*break*/, 7];
                    pId = check.id;
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, prisma.location.create({
                        data: { name: pName, type: 'CITY' }
                    })];
                case 8:
                    pRecord = _f.sent();
                    pId = pRecord.id;
                    addedProvinces++;
                    _f.label = 9;
                case 9:
                    provinceIdMap.set(pCode, pId);
                    districts = pData['quan-huyen'] || {};
                    _loop_1 = function (dCode) {
                        var dData, dName, dId, check, dRecord, wards, wardDataToInsert, _g, _h, wCode, wData, wName, wId, existingWards, existingWardNames_1, finalInsert;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0:
                                    dData = districts[dCode];
                                    dName = dData.name_with_type;
                                    dId = existingMap.get("".concat(dName.toLowerCase(), "-DISTRICT-").concat(pId));
                                    if (!!dId) return [3 /*break*/, 4];
                                    return [4 /*yield*/, prisma.location.findFirst({ where: { name: dName, parentId: pId } })];
                                case 1:
                                    check = _j.sent();
                                    if (!check) return [3 /*break*/, 2];
                                    dId = check.id;
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, prisma.location.create({
                                        data: { name: dName, type: 'DISTRICT', parentId: pId }
                                    })];
                                case 3:
                                    dRecord = _j.sent();
                                    dId = dRecord.id;
                                    addedDistricts++;
                                    _j.label = 4;
                                case 4:
                                    districtIdMap.set(dCode, dId);
                                    wards = dData['xa-phuong'] || {};
                                    wardDataToInsert = [];
                                    for (_g = 0, _h = Object.keys(wards); _g < _h.length; _g++) {
                                        wCode = _h[_g];
                                        wData = wards[wCode];
                                        wName = wData.name_with_type;
                                        wId = existingMap.get("".concat(wName.toLowerCase(), "-WARD-").concat(dId));
                                        if (!wId) {
                                            wardDataToInsert.push({ name: wName, type: 'WARD', parentId: dId });
                                        }
                                    }
                                    if (!(wardDataToInsert.length > 0)) return [3 /*break*/, 7];
                                    return [4 /*yield*/, prisma.location.findMany({
                                            where: { parentId: dId, type: 'WARD' }
                                        })];
                                case 5:
                                    existingWards = _j.sent();
                                    existingWardNames_1 = existingWards.map(function (w) { return w.name.toLowerCase(); });
                                    finalInsert = wardDataToInsert.filter(function (w) { return !existingWardNames_1.includes(w.name.toLowerCase()); });
                                    if (!(finalInsert.length > 0)) return [3 /*break*/, 7];
                                    return [4 /*yield*/, prisma.location.createMany({
                                            data: finalInsert
                                        })];
                                case 6:
                                    _j.sent();
                                    addedWards += finalInsert.length;
                                    _j.label = 7;
                                case 7: return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, _d = Object.keys(districts);
                    _f.label = 10;
                case 10:
                    if (!(_c < _d.length)) return [3 /*break*/, 13];
                    dCode = _d[_c];
                    return [5 /*yield**/, _loop_1(dCode)];
                case 11:
                    _f.sent();
                    _f.label = 12;
                case 12:
                    _c++;
                    return [3 /*break*/, 10];
                case 13:
                    _a++;
                    return [3 /*break*/, 5];
                case 14:
                    console.log("Added ".concat(addedProvinces, " provinces, ").concat(addedDistricts, " districts, ").concat(addedWards, " wards."));
                    // 2. Read old_wards_nghean.json and insert them
                    console.log('Syncing old wards for Nghệ An...');
                    oldWardsPath = path_1.default.join(__dirname, '..', 'prisma', 'data', 'old_wards_nghean.json');
                    if (!fs_1.default.existsSync(oldWardsPath)) return [3 /*break*/, 25];
                    oldWardsStr = fs_1.default.readFileSync(oldWardsPath, 'utf8');
                    oldWardsData = JSON.parse(oldWardsStr);
                    addedOldWards = 0;
                    _e = 0, oldWardsData_1 = oldWardsData;
                    _f.label = 15;
                case 15:
                    if (!(_e < oldWardsData_1.length)) return [3 /*break*/, 24];
                    oldWard = oldWardsData_1[_e];
                    pId = existingMap.get("t\u1EC9nh ngh\u1EC7 an-CITY-") || existingMap.get("t\u1EC9nh ngh\u1EC7 an-PROVINCE-");
                    if (!!pId) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.location.findFirst({ where: { name: 'Tỉnh Nghệ An' } })];
                case 16:
                    ngh = _f.sent();
                    if (ngh)
                        pId = ngh.id;
                    _f.label = 17;
                case 17:
                    if (!pId) return [3 /*break*/, 23];
                    return [4 /*yield*/, prisma.location.findFirst({
                            where: { name: oldWard.districtName, parentId: pId, type: 'DISTRICT' }
                        })];
                case 18:
                    dRecord = _f.sent();
                    if (!dRecord) return [3 /*break*/, 22];
                    wId = existingMap.get("".concat(oldWard.name.toLowerCase(), "-OLD_WARD-").concat(dRecord.id));
                    if (!!wId) return [3 /*break*/, 21];
                    return [4 /*yield*/, prisma.location.findFirst({
                            where: { name: oldWard.name, type: 'OLD_WARD', parentId: dRecord.id }
                        })];
                case 19:
                    checkOld = _f.sent();
                    if (!!checkOld) return [3 /*break*/, 21];
                    return [4 /*yield*/, prisma.location.create({
                            data: { name: oldWard.name, type: 'OLD_WARD', parentId: dRecord.id }
                        })];
                case 20:
                    _f.sent();
                    addedOldWards++;
                    _f.label = 21;
                case 21: return [3 /*break*/, 23];
                case 22:
                    console.warn("Could not find district ".concat(oldWard.districtName, " in Ngh\u1EC7 An."));
                    _f.label = 23;
                case 23:
                    _e++;
                    return [3 /*break*/, 15];
                case 24:
                    console.log("Added ".concat(addedOldWards, " OLD_WARDs."));
                    return [3 /*break*/, 26];
                case 25:
                    console.log('No old_wards_nghean.json found, skipping.');
                    _f.label = 26;
                case 26:
                    console.log('=== SYNC LOCATIONS COMPLETED ===');
                    return [3 /*break*/, 30];
                case 27:
                    error_1 = _f.sent();
                    console.error('Error syncing locations:', error_1);
                    return [3 /*break*/, 30];
                case 28: return [4 /*yield*/, prisma.$disconnect()];
                case 29:
                    _f.sent();
                    return [7 /*endfinally*/];
                case 30: return [2 /*return*/];
            }
        });
    });
}
syncLocations();
