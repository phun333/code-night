'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
var client_1 = require('@prisma/client');
var prisma = new client_1.PrismaClient();
function main() {
  return __awaiter(this, void 0, void 0, function () {
    var resources, _i, resources_1, resource, rules, _a, rules_1, rule;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          // Clear existing data
          return [4 /*yield*/, prisma.allocation.deleteMany()];
        case 1:
          // Clear existing data
          _b.sent();
          return [4 /*yield*/, prisma.request.deleteMany()];
        case 2:
          _b.sent();
          return [4 /*yield*/, prisma.systemLog.deleteMany()];
        case 3:
          _b.sent();
          return [4 /*yield*/, prisma.resource.deleteMany()];
        case 4:
          _b.sent();
          return [4 /*yield*/, prisma.user.deleteMany()];
        case 5:
          _b.sent();
          return [4 /*yield*/, prisma.allocationRule.deleteMany()];
        case 6:
          _b.sent();
          return [4 /*yield*/, prisma.automationConfig.deleteMany()];
        case 7:
          _b.sent();
          // Seed Admin User only (other users will be created by request feeder)
          return [
            4 /*yield*/,
            prisma.user.create({
              data: {
                id: 'ADMIN1',
                name: 'Admin Turkcell',
                email: 'admin@turkcell.com',
                password: 'admin123',
                city: 'Istanbul',
                role: 'ADMIN',
              },
            }),
          ];
        case 8:
          // Seed Admin User only (other users will be created by request feeder)
          _b.sent();
          console.log('Seeded 1 admin user');
          resources = [
            {
              id: 'RES-IST-TECH',
              resourceType: 'TECH_TEAM',
              capacity: 3,
              city: 'Istanbul',
              status: 'AVAILABLE',
            },
            {
              id: 'RES-IST-SUPPORT',
              resourceType: 'SUPPORT_AGENT',
              capacity: 2,
              city: 'Istanbul',
              status: 'AVAILABLE',
            },
            {
              id: 'RES-ANK-TECH',
              resourceType: 'TECH_TEAM',
              capacity: 2,
              city: 'Ankara',
              status: 'AVAILABLE',
            },
            {
              id: 'RES-ANK-SUPPORT',
              resourceType: 'SUPPORT_AGENT',
              capacity: 3,
              city: 'Ankara',
              status: 'AVAILABLE',
            },
          ];
          (_i = 0), (resources_1 = resources);
          _b.label = 9;
        case 9:
          if (!(_i < resources_1.length)) return [3 /*break*/, 12];
          resource = resources_1[_i];
          return [4 /*yield*/, prisma.resource.create({ data: resource })];
        case 10:
          _b.sent();
          _b.label = 11;
        case 11:
          _i++;
          return [3 /*break*/, 9];
        case 12:
          console.log('Seeded '.concat(resources.length, ' resources'));
          rules = [
            { id: 'AR-1', condition: "urgency == 'HIGH'", weight: 50, isActive: true },
            { id: 'AR-2', condition: "urgency == 'MEDIUM'", weight: 30, isActive: true },
            { id: 'AR-3', condition: "urgency == 'LOW'", weight: 10, isActive: true },
            { id: 'AR-4', condition: "service == 'Superonline'", weight: 20, isActive: true },
            { id: 'AR-5', condition: "service == 'Paycell'", weight: 10, isActive: true },
            { id: 'AR-6', condition: "service == 'TV+'", weight: 5, isActive: true },
          ];
          (_a = 0), (rules_1 = rules);
          _b.label = 13;
        case 13:
          if (!(_a < rules_1.length)) return [3 /*break*/, 16];
          rule = rules_1[_a];
          return [4 /*yield*/, prisma.allocationRule.create({ data: rule })];
        case 14:
          _b.sent();
          _b.label = 15;
        case 15:
          _a++;
          return [3 /*break*/, 13];
        case 16:
          console.log('Seeded '.concat(rules.length, ' allocation rules'));
          // NO requests or allocations - they will be created by the automation system
          console.log('Seeding completed! Start automation to begin the demo.');
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
  .finally(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, prisma.$disconnect()];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
