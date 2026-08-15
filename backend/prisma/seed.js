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
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var city, adminEmail, adminPassword, existingAdmin, crypto_1, bcrypt, hashedPassword, districts, _i, districts_1, d, districtNode, _a, _b, w;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('Seeding locations...');
                    return [4 /*yield*/, prisma.location.deleteMany()];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, prisma.location.create({
                            data: { name: 'Nghệ An', type: 'CITY' }
                        })];
                case 2:
                    city = _c.sent();
                    console.log('Seeding admin account...');
                    adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@bds.com';
                    adminPassword = process.env.SEED_ADMIN_PASSWORD;
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: adminEmail } })];
                case 3:
                    existingAdmin = _c.sent();
                    if (!!existingAdmin) return [3 /*break*/, 6];
                    if (!adminPassword) {
                        crypto_1 = require('crypto');
                        adminPassword = crypto_1.randomBytes(9).toString('base64').replace(/\+/g, 'x').replace(/\//g, 'y');
                    }
                    bcrypt = require('bcrypt');
                    return [4 /*yield*/, bcrypt.hash(adminPassword, 10)];
                case 4:
                    hashedPassword = _c.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: adminEmail,
                                password: hashedPassword,
                                name: 'Quản trị viên',
                                phone: '0987654321',
                                role: 'ADMIN',
                                slug: 'admin-bds',
                                status: 'FORCE_CHANGE_PASSWORD', // Force password change on first login
                            }
                        })];
                case 5:
                    _c.sent();
                    console.log("Admin account created: ".concat(adminEmail, " / ").concat(adminPassword));
                    console.log('IMPORTANT: Please save this password. You will be forced to change it on your first login.');
                    _c.label = 6;
                case 6:
                    districts = [
                        {
                            "name": "Huyện Anh Sơn",
                            "wards": [
                                "Xã Anh Sơn",
                                "Xã Yên Xuân",
                                "Xã Nhân Hoà",
                                "Xã Anh Sơn Đông",
                                "Xã Vĩnh Tường",
                                "Xã Thành Bình Thọ"
                            ]
                        },
                        {
                            "name": "Huyện Con Cuông",
                            "wards": [
                                "Xã Con Cuông",
                                "Xã Môn Sơn",
                                "Xã Mậu Thạch",
                                "Xã Cam Phục",
                                "Xã Châu Khê",
                                "Xã Bình Chuẩn"
                            ]
                        },
                        {
                            "name": "Huyện Diễn Châu",
                            "wards": [
                                "Xã Diễn Châu",
                                "Xã Đức Châu",
                                "Xã Quảng Châu",
                                "Xã Hải Châu",
                                "Xã Tân Châu",
                                "Xã An Châu",
                                "Xã Minh Châu",
                                "Xã Hùng Châu"
                            ]
                        },
                        {
                            "name": "Huyện Đô Lương",
                            "wards": [
                                "Xã Đô Lương",
                                "Xã Bạch Ngọc",
                                "Xã Văn Hiến",
                                "Xã Bạch Hà",
                                "Xã Thuần Trung",
                                "Xã Lương Sơn"
                            ]
                        },
                        {
                            "name": "Thị xã Hoàng Mai",
                            "wards": [
                                "Phường Hoàng Mai",
                                "Phường Tân Mai",
                                "Phường Quỳnh Mai"
                            ]
                        },
                        {
                            "name": "Huyện Hưng Nguyên",
                            "wards": [
                                "Xã Hưng Nguyên",
                                "Xã Yên Trung",
                                "Xã Hưng Nguyên Nam",
                                "Xã Lam Thành"
                            ]
                        },
                        {
                            "name": "Huyện Kỳ Sơn",
                            "wards": [
                                "Xã Mường Xén",
                                "Xã Hữu Kiệm",
                                "Xã Nậm Cắn",
                                "Xã Chiêu Lưu",
                                "Xã Na Loi",
                                "Xã Mường Típ",
                                "Xã Na Ngoi",
                                "Xã Mỹ Lý",
                                "Xã Bắc Lý",
                                "Xã Keng Đu",
                                "Xã Huồi Tụ",
                                "Xã Mường Lống"
                            ]
                        },
                        {
                            "name": "Huyện Nam Đàn",
                            "wards": [
                                "Xã Vạn An",
                                "Xã Nam Đàn",
                                "Xã Đại Huệ",
                                "Xã Thiên Nhẫn",
                                "Xã Kim Liên"
                            ]
                        },
                        {
                            "name": "Huyện Nghĩa Đàn",
                            "wards": [
                                "Xã Nghĩa Đàn",
                                "Xã Nghĩa Thọ",
                                "Xã Nghĩa Lâm",
                                "Xã Nghĩa Mai",
                                "Xã Nghĩa Hưng",
                                "Xã Nghĩa Khánh",
                                "Xã Nghĩa Lộc"
                            ]
                        },
                        {
                            "name": "Huyện Nghi Lộc",
                            "wards": [
                                "Xã Nghi Lộc",
                                "Xã Phúc Lộc",
                                "Xã Đông Lộc",
                                "Xã Trung Lộc",
                                "Xã Thần Lĩnh",
                                "Xã Hải Lộc",
                                "Xã Văn Kiều"
                            ]
                        },
                        {
                            "name": "Huyện Quế Phong",
                            "wards": [
                                "Xã Quế Phong",
                                "Xã Tiền Phong",
                                "Xã Tri Lễ",
                                "Xã Mường Quàng",
                                "Xã Thông Thụ"
                            ]
                        },
                        {
                            "name": "Huyện Quỳ Châu",
                            "wards": [
                                "Xã Quỳ Châu",
                                "Xã Châu Tiến",
                                "Xã Hùng Chân",
                                "Xã Châu Bình"
                            ]
                        },
                        {
                            "name": "Huyện Quỳ Hợp",
                            "wards": [
                                "Xã Quỳ Hợp",
                                "Xã Tam Hợp",
                                "Xã Châu Lộc",
                                "Xã Châu Hồng",
                                "Xã Mường Ham",
                                "Xã Mường Chọng",
                                "Xã Minh Hợp"
                            ]
                        },
                        {
                            "name": "Huyện Quỳnh Lưu",
                            "wards": [
                                "Xã Quỳnh Lưu",
                                "Xã Quỳnh Văn",
                                "Xã Quỳnh Anh",
                                "Xã Quỳnh Tam",
                                "Xã Quỳnh Phú",
                                "Xã Quỳnh Sơn",
                                "Xã Quỳnh Thắng"
                            ]
                        },
                        {
                            "name": "Huyện Tân Kỳ",
                            "wards": [
                                "Xã Tân Kỳ",
                                "Xã Tân Phú",
                                "Xã Tân An",
                                "Xã Nghĩa Đồng",
                                "Xã Giai Xuân",
                                "Xã Nghĩa Hành",
                                "Xã Tiên Đồng"
                            ]
                        },
                        {
                            "name": "Thị xã Thái Hoà",
                            "wards": [
                                "Phường Thái Hoà",
                                "Phường Tây Hiếu",
                                "Xã Đông Hiếu"
                            ]
                        },
                        {
                            "name": "Huyện Thanh Chương",
                            "wards": [
                                "Xã Cát Ngạn",
                                "Xã Tam Đồng",
                                "Xã Hạnh Lâm",
                                "Xã Sơn Lâm",
                                "Xã Hoa Quân",
                                "Xã Kim Bảng",
                                "Xã Bích Hào",
                                "Xã Đại Đồng",
                                "Xã Xuân Lâm"
                            ]
                        },
                        {
                            "name": "Huyện Tương Dương",
                            "wards": [
                                "Xã Tam Quang",
                                "Xã Tam Thái",
                                "Xã Tương Dương",
                                "Xã Lượng Minh",
                                "Xã Yên Na",
                                "Xã Yên Hoà",
                                "Xã Nga My",
                                "Xã Hữu Khuông",
                                "Xã Nhôn Mai"
                            ]
                        },
                        {
                            "name": "Thành phố Vinh",
                            "wards": [
                                "Phường Trường Vinh",
                                "Phường Thành Vinh",
                                "Phường Vinh Hưng",
                                "Phường Vinh Phú",
                                "Phường Vinh Lộc",
                                "Phường Cửa Lò"
                            ]
                        },
                        {
                            "name": "Huyện Yên Thành",
                            "wards": [
                                "Xã Yên Thành",
                                "Xã Quan Thành",
                                "Xã Hợp Minh",
                                "Xã Vân Tụ",
                                "Xã Vân Du",
                                "Xã Quang Đồng",
                                "Xã Giai Lạc",
                                "Xã Bình Minh",
                                "Xã Đông Thành"
                            ]
                        }
                    ];
                    _i = 0, districts_1 = districts;
                    _c.label = 7;
                case 7:
                    if (!(_i < districts_1.length)) return [3 /*break*/, 13];
                    d = districts_1[_i];
                    return [4 /*yield*/, prisma.location.create({
                            data: {
                                name: d.name,
                                type: 'DISTRICT',
                                parentId: city.id
                            }
                        })];
                case 8:
                    districtNode = _c.sent();
                    _a = 0, _b = d.wards;
                    _c.label = 9;
                case 9:
                    if (!(_a < _b.length)) return [3 /*break*/, 12];
                    w = _b[_a];
                    return [4 /*yield*/, prisma.location.create({
                            data: {
                                name: w,
                                type: 'WARD',
                                parentId: districtNode.id
                            }
                        })];
                case 10:
                    _c.sent();
                    _c.label = 11;
                case 11:
                    _a++;
                    return [3 /*break*/, 9];
                case 12:
                    _i++;
                    return [3 /*break*/, 7];
                case 13:
                    console.log('Seed Location Nghệ An thành công!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
