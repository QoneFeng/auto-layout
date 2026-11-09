"use strict";
var SmartHomeRules = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/browser/rules-entry.ts
  var rules_entry_exports = {};
  __export(rules_entry_exports, {
    ANCHOR_LABELS: () => ANCHOR_LABELS,
    CROSS_RULE_TEMPLATES: () => CROSS_RULE_TEMPLATES,
    MOUNT_LABELS: () => MOUNT_LABELS2,
    PRIORITY_LABELS: () => PRIORITY_LABELS,
    allRules: () => allRules,
    catalogDevicesForRule: () => catalogDevicesForRule,
    explainDevice: () => explainDevice,
    explainNotes: () => explainNotes,
    placeExistingDevices: () => placeExistingDevices,
    pointInPolygon: () => pointInPolygon,
    polygonArea: () => polygonArea,
    polygonCentroid: () => polygonCentroid,
    rulesForDevice: () => rulesForDevice,
    rulesForSpace: () => rulesForSpace,
    runLayout: () => runLayout
  });

  // src/data/rules.generated.json
  var rules_generated_default = [
    {
      pointCode: "KT-DL-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "\u57FA\u7840\u9635\u5217",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "inscribedGrid",
        rows: 2,
        rowGap: 500,
        colGap: 800,
        offset: 300,
        raw: "\u6700\u5927\u5185\u63A5\u77E9\u5F62\uFF0C\u53CC\u5217\u5E73\u884C\u957F\u8FB9\uFF0C\u5217\u95F4\u8DDD 500"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: true,
        round: "ceil",
        raw: "PER_AREA: even(max(2, ceil(S/2.5)))"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "BEAM",
        "CEILING_HATCH",
        "TV_SCREEN"
      ],
      fallback: [
        "REDUCE",
        "SINGLE_ROW"
      ],
      sourceText: "PER_AREA: even(max(2, ceil(S/2.5)))",
      traceFlags: []
    },
    {
      pointCode: "KT-DL-02",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "\u901A\u884C\u8865\u5149",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "TV"
        ],
        target: "tv",
        raw: "\u6C99\u53D1\u533A\u4E0E\u7535\u89C6\u5899\u4E4B\u95F4\u7684\u901A\u884C\u5E26\u4E2D\u8F74"
      },
      quantity: {
        kind: "perLength",
        value: 2.5,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_AREA: max(2, ceil(L/2.5))\uFF0CL \u4E3A\u901A\u884C\u5E26\u957F\u5EA6"
      },
      spacing: 1e3,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_AREA: max(2, ceil(L/2.5))\uFF0CL \u4E3A\u901A\u884C\u5E26\u957F\u5EA6",
      traceFlags: []
    },
    {
      pointCode: "KT-SP-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u7535\u89C6\u5899\u6D17\u5899",
      mount: "CL",
      height: {
        base: "CL",
        offset: 175,
        min: 0,
        max: 350
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "tvCabinet"
        ],
        target: "tvCabinet",
        raw: "\u7535\u89C6\u5899\u5899\u9762\uFF0C\u6CBF\u5899\u7B49\u5206"
      },
      quantity: {
        kind: "perLength",
        value: 1,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(W/1.0))\uFF0CW \u4E3A\u7535\u89C6\u5899\u53EF\u7528\u5BBD"
      },
      spacing: 800,
      priority: "P1",
      collision: [
        "TV_SCREEN"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(W/1.0))\uFF0CW \u4E3A\u7535\u89C6\u5899\u53EF\u7528\u5BBD",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-SP-02",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u5C55\u793A/\u7AEF\u666F",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "wallOffset",
        offset: 250,
        raw: "\u88C5\u9970\u753B/\u7AEF\u666F\u4E2D\u5FC3\u6B63\u4E0A\u65B9\u504F\u5899 200~300"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "PER_FURNITURE: 1/\u76EE\u6807"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u76EE\u6807",
      traceFlags: [
        "GENERIC_COUNT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-SP-03",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u6C99\u53D1\u9605\u8BFB\u4F4D",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u6C99\u53D1\u4E24\u7AEF\u5916\u4FA7 300~500\uFF0C\u5411\u6C99\u53D1\u524D\u65B9\u504F 30\xB0~45\xB0"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 0,
        raw: "PER_FURNITURE: 0~2"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 0~2",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_COUNT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-TR-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u78C1\u5438\u8F68\u9053",
      deviceCanonical: "\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u78C1\u5438\u8F68\u9053",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "TV"
        ],
        target: "tv",
        raw: "\u6CBF\u6C99\u53D1\u957F\u8F74\u6216\u7535\u89C6\u5899\u5E73\u884C\u8F74\uFF0C\u8DDD\u5899 400~600"
      },
      quantity: {
        kind: "measuredLength",
        measure: "track",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F\uFF08\u5355\u6761/\u53CC\u6761\u6309\u5E03\u5C40\uFF0C\u6309\u6A21\u6570\u53D6\u6574\uFF09",
        value: 2,
        min: 1,
        max: 2
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F\uFF08\u5355\u6761/\u53CC\u6761\u6309\u5E03\u5C40\uFF0C\u6309\u6A21\u6570\u53D6\u6574\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-MG-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u78C1\u5438\u6CDB\u5149\u706F\u4F53",
      deviceCanonical: "\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u706F\u4F53",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "hostTrack",
        raw: "\u6CBF\u8F68\u9053\u7B49\u8DDD"
      },
      quantity: {
        kind: "perLength",
        value: 0.8,
        even: false,
        round: "floor",
        raw: "PER_LENGTH: floor(L/0.8)"
      },
      spacing: 150,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: floor(L/0.8)",
      traceFlags: []
    },
    {
      pointCode: "KT-MG-02",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u78C1\u5438\u683C\u6805\u706F\u4F53",
      deviceCanonical: "\u78C1\u5438\u683C\u6805\u706F \xB7 \u706F\u4F53",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u4E0E\u6CDB\u5149\u706F\u4EA4\u9519"
      },
      quantity: {
        kind: "perLength",
        value: 1.2,
        even: false,
        round: "floor",
        raw: "PER_LENGTH: floor(L/1.2)"
      },
      spacing: 150,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: floor(L/1.2)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-LS-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "perimeter",
        offset: 100,
        raw: "\u540A\u9876\u56DB\u5468\u706F\u69FD\uFF08\u56DE\u5B57\u5F62/L \u5F62\uFF09"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING",
        "WINDOW"
      ],
      fallback: [
        "SINGLE_SIDE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "PERIMETER",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-LS-02",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u7A97\u5E18\u706F\u5E26",
      deviceCanonical: "\u7A97\u5E18\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u7A97\u5E18\u76D2\u5185\u6CBF"
      },
      quantity: {
        kind: "measuredLength",
        measure: "window",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u7A97\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "WINDOW"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u7A97\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-CB-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-FL-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u843D\u5730\u706F",
      deviceCanonical: "\u843D\u5730\u706F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1500,
        min: 1400,
        max: 1600
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u6C99\u53D1\u5355\u4FA7\u6216\u9605\u8BFB\u6905\u4FA7\u540E\u65B9"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P4",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-PN-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u5165\u6237\u95E8/\u5BA2\u5385\u4E3B\u5165\u53E3\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7\u5899\u9762\uFF0C\u8DDD\u95E8\u5957 150~200"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(2)\uFF08\u95E8\u4E24\u4FA7\u5404 1\uFF09"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)\uFF08\u95E8\u4E24\u4FA7\u5404 1\uFF09",
      traceFlags: []
    },
    {
      pointCode: "KT-PN-02",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u60C5\u666F\u9762\u677F",
      deviceCanonical: "\u60C5\u666F\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u540C\u4E0A\uFF0C\u4E0E\u5F00\u5173\u9762\u677F\u5E76\u6392\uFF08\u95F4\u8DDD 100\uFF09"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-PN-03",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u4E2D\u63A7\u5C4F",
      deviceCanonical: "\u4E2D\u63A7\u5C4F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1450,
        min: 1400,
        max: 1500
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "sofa"
        ],
        target: "sofa",
        raw: "\u5BA2\u5385\u4E3B\u5165\u53E3\u6216\u6C99\u53D1\u6B63\u5BF9\u5899\u9762"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "TV_SCREEN"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "KT-SN-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u4EBA\u5728\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u5728\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "sofa"
        ],
        target: "sofa",
        raw: "\u6C99\u53D1\u533A\u4E0A\u65B9\u504F\u5165\u53E3\u4FA7\uFF0C\u8986\u76D6\u6C99\u53D1+\u8336\u51E0"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "AC_OUTLET"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "KT-SN-02",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u5149\u7167\u4F20\u611F\u5668",
      deviceCanonical: "\u5149\u7167\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8DDD\u7A97 500~800"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "WINDOW"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-AU-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u5438\u9876\u5587\u53ED",
      deviceCanonical: "\u5438\u9876\u5587\u53ED",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u6C99\u53D1\u533A\u4E2D\u8F74\u4E24\u4FA7\u5BF9\u79F0"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 1500,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "KT-CV-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u6444\u50CF\u5934",
      deviceCanonical: "\u6444\u50CF\u5934",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5BF9\u51C6\u5165\u6237/\u5BA2\u5385\u4E3B\u901A\u9053"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "KT-AC-01",
      spaceCode: "KT",
      spaceName: "\u5BA2\u5385",
      deviceType2: "\u67DC\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u67DC\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 0
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u8DDD\u5899 \u2265100\uFF0C\u51FA\u98CE\u4E0D\u76F4\u5439\u6C99\u53D1"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "CEILING_HATCH"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CT-PD-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u540A\u706F",
      deviceCanonical: "\u540A\u706F",
      usage: "\u9910\u540A",
      mount: "CL",
      height: {
        base: "CL",
        offset: 750,
        min: 700,
        max: 800
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "diningTable"
        ],
        target: "diningTable",
        raw: "**\u9910\u684C\u51E0\u4F55\u4E2D\u5FC3\u6B63\u4E0A\u65B9**\uFF08\u4E0D\u662F\u623F\u95F4\u4E2D\u5FC3\uFF09"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "CT-DL-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "inscribedRectCenter",
        raw: "\u6700\u5927\u5185\u63A5\u77E9\u5F62\uFF0C\u907F\u5F00\u9910\u684C\u6295\u5F71\uFF08\u684C\u5916\u6269 300\uFF09"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: true,
        round: "ceil",
        raw: "PER_AREA: even(max(2, ceil(S/2.5)))"
      },
      spacing: 800,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: even(max(2, ceil(S/2.5)))",
      traceFlags: []
    },
    {
      pointCode: "CT-SP-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u9910\u8FB9\u67DC\u6D17\u5899",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "sideboard"
        ],
        target: "sideboard",
        raw: "\u9910\u8FB9\u67DC\u524D\u6CBF\u7EBF"
      },
      quantity: {
        kind: "perLength",
        value: 1,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(W/1.0))"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(W/1.0))",
      traceFlags: []
    },
    {
      pointCode: "CT-LS-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "perimeter",
        offset: 100,
        raw: "\u540A\u9876\u56DB\u5468"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "SINGLE_SIDE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "PERIMETER",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CT-CB-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CT-PN-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u9910\u5385\u4E3B\u5165\u53E3\u95E8\u4FA7\uFF0C\u8DDD\u95E8\u5957 150~200"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "CT-PN-02",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u60C5\u666F\u9762\u677F",
      deviceCanonical: "\u60C5\u666F\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u4E0E\u5F00\u5173\u5E76\u6392"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CT-AU-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u5438\u9876\u5587\u53ED",
      deviceCanonical: "\u5438\u9876\u5587\u53ED",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u9910\u684C\u4E2D\u8F74\u4E24\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 1500,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "CT-CU-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97 1 \u53F0\uFF0C\u9760\u7535\u673A\u4FA7\u7559 100"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING: 1/\u7A97"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING: 1/\u7A97",
      traceFlags: []
    },
    {
      pointCode: "CT-AC-01",
      spaceCode: "CT",
      spaceName: "\u9910\u5385",
      deviceType2: "\u67DC\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u67DC\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 0
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u540C\u5BA2\u5385"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-CL-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u5438\u9876\u706F",
      deviceCanonical: "\u5438\u9876\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "bed"
        ],
        target: "bed",
        raw: "\u5E8A\u533A\u51E0\u4F55\u4E2D\u5FC3\uFF08\u5E8A\u57AB\u4E2D\u5FC3\uFF09"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "ZW-DL-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "bed"
        ],
        target: "bed",
        raw: "\u5E8A\u4E24\u4FA7\u901A\u9053\u4E0A\u65B9\uFF0C\u907F\u5F00\u5E8A\u6295\u5F71"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: true,
        round: "ceil",
        raw: "PER_AREA: even(max(2, ceil(S/2.5)))"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: even(max(2, ceil(S/2.5)))",
      traceFlags: []
    },
    {
      pointCode: "ZW-SP-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u5E8A\u5934\u9605\u8BFB",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u5E8A\u5934\u67DC\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2",
      traceFlags: []
    },
    {
      pointCode: "ZW-WL-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u58C1\u706F",
      deviceCanonical: "\u58C1\u706F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1e3,
        min: 600,
        max: 1400
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u5E8A\u5934\u67DC\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2",
      traceFlags: []
    },
    {
      pointCode: "ZW-LS-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u8D34\u5899\u706F\u5E26",
      deviceCanonical: "\u8D34\u5899\u706F\u5E26",
      usage: "\u5E8A\u5934\u80CC\u666F",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E8A\u5934\u80CC\u666F\u5899\u901A\u957F"
      },
      quantity: {
        kind: "measuredLength",
        measure: "wall",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u80CC\u666F\u5899\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u80CC\u666F\u5899\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-LS-02",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "perimeter",
        offset: 100,
        raw: "\u540A\u9876\u56DB\u5468"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING",
        "WINDOW"
      ],
      fallback: [
        "SINGLE_SIDE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "PERIMETER",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-LS-03",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u7A97\u5E18\u706F\u5E26",
      deviceCanonical: "\u7A97\u5E18\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u7A97\u5BBD"
      },
      quantity: {
        kind: "measuredLength",
        measure: "window",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u7A97\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u7A97\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-CB-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-PN-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "\u95E8\u53E3",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u5367\u5BA4\u95E8\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7\u5899\uFF0C\u8DDD\u95E8\u5957 150~200"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1)\uFF08\u5355\u5F00\uFF09\u6216 2\uFF08\u53CC\u5F00\uFF09"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)\uFF08\u5355\u5F00\uFF09\u6216 2\uFF08\u53CC\u5F00\uFF09",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-PN-02",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "\u5E8A\u5934",
      mount: "SL",
      height: {
        base: "SL",
        offset: 750,
        min: 700,
        max: 800
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u6BCF\u4FA7\u5E8A\u5934\u67DC\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC",
      traceFlags: []
    },
    {
      pointCode: "ZW-PN-03",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u65E0\u7EBF\u5F00\u5173",
      deviceCanonical: "\u65E0\u7EBF\u5F00\u5173",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 700
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u53CC\u4FA7\u5E8A\u5934"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "ZW-PN-04",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u60C5\u666F\u9762\u677F",
      deviceCanonical: "\u60C5\u666F\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u4E0E\u95E8\u53E3\u5F00\u5173\u5E76\u6392"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-SN-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u4EBA\u5728\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u5728\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8986\u76D6\u5E8A+\u901A\u9053"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "ZW-SN-02",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1200
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u5E8A\u5934\u5BF9\u4FA7\u5899"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "AC_OUTLET"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "ZW-CU-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97 1 \u53F0"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "ZW-AC-01",
      spaceCode: "ZW",
      spaceName: "\u4E3B\u5367",
      deviceType2: "\u6302\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u6302\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 2300,
        min: 2200,
        max: 2400
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u5E8A\u4FA7\u5899\uFF0C\u51FA\u98CE\u4E0D\u76F4\u5439\u5E8A\u5934"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-CL-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u5438\u9876\u706F / \u9762\u677F\u706F",
      deviceCanonical: "\u5438\u9876\u706F;\u9762\u677F\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "inscribedRectCenter",
        raw: "\u6700\u5927\u5185\u63A5\u77E9\u5F62\u4E2D\u5FC3"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "SF-DL-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u4E66\u684C\u5916\u56F4 + \u901A\u884C\u533A"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_AREA: max(2, ceil(S/2.5))"
      },
      spacing: 800,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: max(2, ceil(S/2.5))",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-SP-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u4E66\u67DC\u6D17\u5899",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "bookshelf"
        ],
        target: "bookshelf",
        raw: "\u4E66\u67DC\u524D\u6CBF\u7EBF"
      },
      quantity: {
        kind: "perLength",
        value: 1,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(W/1.0))"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(W/1.0))",
      traceFlags: []
    },
    {
      pointCode: "SF-SP-02",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u4E66\u684C\u91CD\u70B9",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u4E66\u684C\u957F\u8FB9\u4E2D\u70B9\u6216\u4E24\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "TV_SCREEN"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-TL-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u53F0\u706F",
      deviceCanonical: "\u53F0\u706F",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 425,
        min: 400,
        max: 450
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u4E66\u684C\u975E\u60EF\u7528\u624B\u4FA7"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "desk"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u4E66\u684C"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u4E66\u684C",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-CB-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-LS-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "perimeter",
        offset: 100,
        raw: "\u56DB\u5468\u6216\u5355\u8FB9"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "PERIMETER",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-PN-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u95E8\u5185\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "SF-SN-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u4EBA\u5728\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u5728\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "desk"
        ],
        target: "desk",
        raw: "\u8986\u76D6\u4E66\u684C+\u5EA7\u6905"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "SF-SN-02",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u5149\u7167\u4F20\u611F\u5668",
      deviceCanonical: "\u5149\u7167\u4F20\u611F\u5668",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 1200
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u9760\u7A97\uFF0C\u907F\u514D\u76F4\u5C04"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-NP-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u7F51\u53E3\u9762\u677F",
      deviceCanonical: "\u7F51\u53E3\u9762\u677F",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 300
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u4E66\u684C\u4FA7\u5899"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "SF-CU-01",
      spaceCode: "SF",
      spaceName: "\u4E66\u623F",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97 1 \u53F0"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "WS-CL-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u5438\u9876\u706F",
      deviceCanonical: "\u5438\u9876\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "bed"
        ],
        target: "bed",
        raw: "\u5E8A\u57AB\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "WS-DL-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "bed"
        ],
        target: "bed",
        raw: "\u5E8A\u4E24\u4FA7\u901A\u9053\u4E0A\u65B9\uFF0C\u907F\u5F00\u5E8A\u6295\u5F71"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: true,
        round: "ceil",
        raw: "PER_AREA: even(max(2, ceil(S/2.5)))\uFF1BS\u226413\u33A1 \u65F6\u5173\u95ED"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: even(max(2, ceil(S/2.5)))\uFF1BS\u226413\u33A1 \u65F6\u5173\u95ED",
      traceFlags: []
    },
    {
      pointCode: "WS-SP-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u5E8A\u5934\u9605\u8BFB",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u5E8A\u5934\u67DC\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2",
      traceFlags: []
    },
    {
      pointCode: "WS-WL-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u58C1\u706F",
      deviceCanonical: "\u58C1\u706F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300,
        min: 1200,
        max: 1400
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u5E8A\u5934\u67DC\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2",
      traceFlags: []
    },
    {
      pointCode: "WS-LS-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5355\u8FB9\uFF08\u5E8A\u5C3E\u4FA7\uFF09"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WS-LS-02",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u7A97\u5E18\u706F\u5E26",
      deviceCanonical: "\u7A97\u5E18\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u7A97\u5BBD"
      },
      quantity: {
        kind: "measuredLength",
        measure: "window",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u7A97\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u7A97\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WS-CB-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WS-PN-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "\u95E8\u53E3",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u95E8\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7\u5899\uFF0C\u8DDD\u95E8\u5957 150~200"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WS-PN-02",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "\u5E8A\u5934",
      mount: "SL",
      height: {
        base: "SL",
        offset: 750,
        min: 700,
        max: 800
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u6BCF\u4FA7\u5E8A\u5934\u67DC\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC",
      traceFlags: []
    },
    {
      pointCode: "WS-PN-03",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u65E0\u7EBF\u5F00\u5173",
      deviceCanonical: "\u65E0\u7EBF\u5F00\u5173",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 700
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u53CC\u4FA7\u5E8A\u5934"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "WS-SN-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u4EBA\u5728\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u5728\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8986\u76D6\u5E8A+\u901A\u9053"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WS-SN-02",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1200
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u5E8A\u5934\u5BF9\u4FA7\u5899"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "AC_OUTLET"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WS-CU-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97 1 \u53F0"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "WS-AC-01",
      spaceCode: "WS",
      spaceName: "\u5367\u5BA4",
      deviceType2: "\u6302\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u6302\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 2300,
        min: 2200,
        max: 2400
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u5E8A\u4FA7\u5899\uFF0C\u4E0D\u76F4\u5439\u5E8A\u5934"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "LRF-CL-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u5438\u9876\u706F",
      deviceCanonical: "\u5438\u9876\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "bed"
        ],
        target: "bed",
        raw: "\u5E8A\u57AB\u4E2D\u5FC3\u6B63\u4E0A\u65B9\uFF0C\u95F4\u63A5\u51FA\u5149\u4F18\u5148"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "LRF-DL-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "bed"
        ],
        target: "bed",
        raw: "\u5E8A\u4E24\u4FA7\u901A\u9053 + \u8D77\u591C\u8DEF\u5F84\u4E0A\u65B9"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: true,
        round: "ceil",
        raw: "PER_AREA: even(max(2, ceil(S/2.5)))"
      },
      spacing: 700,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: even(max(2, ceil(S/2.5)))",
      traceFlags: []
    },
    {
      pointCode: "LRF-WL-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u58C1\u706F",
      deviceCanonical: "\u58C1\u706F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300,
        min: 1200,
        max: 1400
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u5E8A\u5934\u67DC\u4E2D\u5FC3\u6B63\u4E0A\u65B9\uFF0C\u5E26\u591C\u5149\u6307\u793A"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC\uFF0C\u6700\u591A 2",
      traceFlags: []
    },
    {
      pointCode: "LRF-LS-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u8D34\u5899\u706F\u5E26",
      deviceCanonical: "\u8D34\u5899\u706F\u5E26",
      usage: "\u4F4E\u4F4D",
      mount: "SL",
      height: {
        base: "SL",
        offset: 150,
        min: 100,
        max: 200
      },
      anchor: {
        kind: "pathLine",
        raw: "\u5E8A\u4E0B\u6CBF/\u8E22\u811A\u7EBF\uFF0C\u6CBF\u8D77\u591C\u8DEF\u5F84\u8FDE\u7EED"
      },
      quantity: {
        kind: "measuredLength",
        measure: "path",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u8D77\u591C\u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u8D77\u591C\u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "LRF-LS-02",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u53EA\u505A\u95F4\u63A5\u53CD\u5C04"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "LRF-CB-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "LRF-PN-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "\u95E8\u53E3",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u95E8\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7\u5899"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "LRF-PN-02",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "\u5E8A\u5934",
      mount: "SL",
      height: {
        base: "SL",
        offset: 750,
        min: 700,
        max: 800
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u6BCF\u4FA7\u5E8A\u5934\u67DC\u4E0A\u65B9\uFF0C\u5927\u5B57/\u80CC\u5149"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "bed",
          "nightstand"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5E8A\u5934\u67DC",
      traceFlags: []
    },
    {
      pointCode: "LRF-PN-03",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u65E0\u7EBF\u5F00\u5173",
      deviceCanonical: "\u65E0\u7EBF\u5F00\u5173",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 700
      },
      anchor: {
        kind: "furniturePair",
        furnitureTypes: [
          "nightstand"
        ],
        target: "nightstand",
        raw: "\u53CC\u4FA7\u5E8A\u5934\uFF0C\u5E26\u591C\u5149"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "LRF-SN-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "bed"
        ],
        target: "bed",
        raw: "\u5E8A\u4FA7 1 + \u95E8\u53E3 1\uFF0C\u8986\u76D6\u8D77\u591C\u8DEF\u5F84"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "LRF-SN-02",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1200
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u5E8A\u5934\u5BF9\u4FA7\u5899"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "AC_OUTLET"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "LRF-SN-03",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u5149\u7167\u4F20\u611F\u5668",
      deviceCanonical: "\u5149\u7167\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8DDD\u7A97 500~800"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "LRF-CU-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97 1 \u53F0"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "LRF-AC-01",
      spaceCode: "LRF",
      spaceName: "\u8001\u4EBA\u623F",
      deviceType2: "\u6302\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u6302\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 2300,
        min: 2200,
        max: 2400
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u5E8A\u4FA7\u5899\uFF0C\u4E0D\u76F4\u5439\u5E8A\u5934"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-CL-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u5438\u9876\u706F",
      deviceCanonical: "\u5438\u9876\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u62A4\u773C\u4E3B\u706F\uFF0C\u8272\u6E29\u53EF\u8C03\uFF0C\u663E\u8272 \u2265Ra90"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-DL-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E8A\u4FA7\u901A\u9053 + \u73A9\u800D\u533A\u5916\u56F4"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: true,
        round: "ceil",
        raw: "PER_AREA: even(max(2, ceil(S/2.5)))"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: even(max(2, ceil(S/2.5)))",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-SP-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u4EC5\u4E66\u684C/\u5C55\u793A\u76EE\u6807"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 0,
        raw: "FIXED(0~2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-TL-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u53F0\u706F",
      deviceCanonical: "\u53F0\u706F",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 425,
        min: 400,
        max: 450
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5B66\u4E60\u684C\u975E\u60EF\u7528\u624B\u4FA7\uFF0C\u62A4\u773C\u578B"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "PER_FURNITURE: 1/\u5B66\u4E60\u684C"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u5B66\u4E60\u684C",
      traceFlags: [
        "GENERIC_COUNT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-LS-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u8D34\u5899\u706F\u5E26",
      deviceCanonical: "\u8D34\u5899\u706F\u5E26",
      usage: "\u4F4E\u4F4D",
      mount: "SL",
      height: {
        base: "SL",
        offset: 150,
        min: 100,
        max: 200
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E8A\u4E0B\u6CBF\u6216\u8E22\u811A\uFF0C\u517C\u4F5C\u591C\u706F"
      },
      quantity: {
        kind: "measuredLength",
        measure: "path",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-CB-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-PN-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "\u95E8\u53E3",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u95E8\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7\u5899"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-PN-02",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u65E0\u7EBF\u5F00\u5173",
      deviceCanonical: "\u65E0\u7EBF\u5F00\u5173",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 950,
        min: 900,
        max: 1e3
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E8A\u5934\u5355\u4FA7\uFF0C\u513F\u7AE5\u53EF\u53CA"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-SN-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u95E8\u53E3 + \u5E8A\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-SN-02",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1200
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8FDC\u79BB\u7A7A\u8C03/\u7A97"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "AC_OUTLET"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XHF-CU-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97 1 \u53F0"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "XHF-AC-01",
      spaceCode: "XHF",
      spaceName: "\u513F\u7AE5\u623F",
      deviceType2: "\u6302\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u6302\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 2300,
        min: 2200,
        max: 2400
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u5E8A\u4FA7\u5899\uFF0C\u4E0D\u76F4\u5439\u5E8A\u4E0E\u4E66\u684C"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-DL-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u95E8\u5185\u4FA7 1.2m \u8303\u56F4 + \u6362\u978B\u533A\u4E0A\u65B9"
      },
      quantity: {
        kind: "perArea",
        value: 2.5,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_AREA: max(2, ceil(S/2.5))\uFF0C\u6700\u5C0F 2"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: max(2, ceil(S/2.5))\uFF0C\u6700\u5C0F 2",
      traceFlags: []
    },
    {
      pointCode: "XCW-SP-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u7AEF\u666F/\u6302\u753B",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "wallOffset",
        offset: 250,
        raw: "\u7AEF\u666F\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "PER_FURNITURE: 1/\u76EE\u6807"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u76EE\u6807",
      traceFlags: [
        "GENERIC_COUNT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-CB-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "\u978B\u67DC",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50\uFF1B\u9542\u7A7A\u533A\u4E0A\u6CBF"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F + \u9542\u7A7A\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F + \u9542\u7A7A\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-LS-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u8D34\u5899\u706F\u5E26",
      deviceCanonical: "\u8D34\u5899\u706F\u5E26",
      usage: "\u8E22\u811A/\u611F\u5E94",
      mount: "SL",
      height: {
        base: "SL",
        offset: 125,
        min: 100,
        max: 150
      },
      anchor: {
        kind: "pathLine",
        raw: "\u5165\u6237\u5230\u5BA2\u5385\u8DEF\u5F84"
      },
      quantity: {
        kind: "measuredLength",
        measure: "path",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-PN-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u5165\u6237\u95E8\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7\uFF0C\u8DDD\u95E8\u5957 150~200"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-PN-02",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u60C5\u666F\u9762\u677F",
      deviceCanonical: "\u60C5\u666F\u9762\u677F",
      usage: "\u56DE\u5BB6/\u79BB\u5BB6",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u4E0E\u5F00\u5173\u5E76\u6392"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "XCW-PN-03",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u4E2D\u63A7\u5C4F",
      deviceCanonical: "\u4E2D\u63A7\u5C4F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1450,
        min: 1400,
        max: 1500
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u7384\u5173\u4E3B\u5899\u9762\uFF0C\u6B63\u5BF9\u5165\u6237"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "XCW-SN-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8986\u76D6\u5165\u6237 3m \u8303\u56F4"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-SN-02",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u5149\u7167\u4F20\u611F\u5668",
      deviceCanonical: "\u5149\u7167\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u611F\u77E5\u5165\u6237\u81EA\u7136\u5149"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-LK-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u667A\u80FD\u95E8\u9501",
      deviceCanonical: "\u667A\u80FD\u95E8\u9501",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1050,
        min: 1e3,
        max: 1100
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u95E8\u6247\u5916\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "XCW-CV-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u6444\u50CF\u5934",
      deviceCanonical: "\u6444\u50CF\u5934",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u5BF9\u51C6\u5165\u6237\u95E8\u5185\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "XCW-AU-01",
      spaceCode: "XCW",
      spaceName: "\u7384\u5173",
      deviceType2: "\u5438\u9876\u5587\u53ED",
      deviceCanonical: "\u5438\u9876\u5587\u53ED",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u7384\u5173\u4E2D\u8F74"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CF-PL-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u9762\u677F\u706F",
      deviceCanonical: "\u9762\u677F\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u53A8\u623F\u4E3B\u901A\u9053\u4E2D\u8F74"
      },
      quantity: {
        kind: "perArea",
        value: 5,
        min: 1,
        even: false,
        round: "ceil",
        raw: "PER_AREA: max(1, ceil(S/5))"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "STOVE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_AREA: max(1, ceil(S/5))",
      traceFlags: []
    },
    {
      pointCode: "CF-DL-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "kitchenCounter"
        ],
        target: "kitchenCounter",
        raw: "\u64CD\u4F5C\u53F0\u524D 300~500\uFF08\u4EBA\u7AD9\u4F4D\u4E0A\u65B9\u504F\u53F0\u9762\uFF09"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 4,
        furnitureTypes: [
          "kitchenCounter"
        ],
        raw: "PER_LENGTH: max(2, ceil(\u53F0\u9762\u957F/1.5))"
      },
      spacing: 1200,
      priority: "P2",
      collision: [
        "STOVE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(\u53F0\u9762\u957F/1.5))",
      traceFlags: []
    },
    {
      pointCode: "CF-CB-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "\u540A\u67DC\u4E0B",
      mount: "BL",
      height: {
        base: "BL",
        offset: 50
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "upperCabinet"
        ],
        target: "upperCabinet",
        raw: "\u540A\u67DC\u4E0B\u6CBF\u901A\u957F"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u540A\u67DC\u957F\u5EA6\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "STOVE"
      ],
      fallback: [
        "REMOVE",
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u540A\u67DC\u957F\u5EA6\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CF-SP-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u6C34\u69FD/\u5907\u9910",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "kitchenCounter"
        ],
        target: "kitchenCounter",
        raw: "\u6C34\u69FD\u524D\u6CBF\u3001\u5907\u9910\u533A"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 4,
        furnitureTypes: [
          "kitchenCounter"
        ],
        raw: "PER_FURNITURE: 1/\u6C34\u69FD + 0~1/\u5907\u9910\u533A"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_FURNITURE: 1/\u6C34\u69FD + 0~1/\u5907\u9910\u533A",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CF-GR-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u683C\u6805\u706F",
      deviceCanonical: "\u683C\u6805\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u957F\u6761\u5F62\u53A8\u623F\u4E2D\u8F74"
      },
      quantity: {
        kind: "perLength",
        value: 2,
        min: 1,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(1, ceil(L/2))"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: max(1, ceil(L/2))",
      traceFlags: []
    },
    {
      pointCode: "CF-PN-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u53A8\u623F\u95E8\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING",
        "STOVE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "CF-SN-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "kitchenCounter"
        ],
        target: "kitchenCounter",
        raw: "\u8986\u76D6\u64CD\u4F5C\u533A"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "CF-SN-02",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1500
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u53A8\u623F\u5BF9\u89D2"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "STOVE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CF-CU-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "STOVE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "CF-AC-01",
      spaceCode: "CF",
      spaceName: "\u53A8\u623F",
      deviceType2: "\u6302\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u6302\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u53A8\u623F\u901A\u5E38\u4E0D\u914D"
      },
      quantity: {
        kind: "generic",
        value: 1,
        raw: "\u2014"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "\u2014",
      traceFlags: [
        "GENERIC_COUNT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSJ-PL-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u9762\u677F\u706F",
      deviceCanonical: "\u9762\u677F\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "inscribedRectCenter",
        raw: "\u5E72\u533A\u6700\u5927\u5185\u63A5\u77E9\u5F62\u4E2D\u5FC3"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "WET_ZONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "WSJ-DL-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "shower"
        ],
        target: "shower",
        raw: "\u6DCB\u6D74\u533A/\u6D74\u7F38\u4E0A\u65B9\uFF08\u9632\u6F6E\u578B\uFF09"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "PER_FURNITURE: 1/\u6E7F\u533A"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u6E7F\u533A",
      traceFlags: [
        "GENERIC_COUNT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSJ-SP-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u955C\u524D",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "vanity"
        ],
        target: "vanity",
        raw: "\u6D74\u5BA4\u67DC\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "vanity"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u6D74\u5BA4\u67DC"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u6D74\u5BA4\u67DC",
      traceFlags: []
    },
    {
      pointCode: "WSJ-SP-02",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u9A6C\u6876",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "toilet"
        ],
        target: "toilet",
        raw: "\u9A6C\u6876\u6B63\u4E0A\u65B9\u504F\u524D"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "toilet"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u9A6C\u6876"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u9A6C\u6876",
      traceFlags: []
    },
    {
      pointCode: "WSJ-SP-03",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u6DCB\u6D74",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "shower"
        ],
        target: "shower",
        raw: "\u6DCB\u6D74\u533A\u4E2D\u5FC3"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "shower"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u6DCB\u6D74\u623F"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_FURNITURE: 1/\u6DCB\u6D74\u623F",
      traceFlags: []
    },
    {
      pointCode: "WSJ-CB-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "\u955C\u67DC",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe",
          "vanity"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF + \u955C\u67DC\u4E0B\u6CBF"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u955C\u67DC\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u955C\u67DC\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSJ-LS-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "perimeter",
        offset: 100,
        raw: "\u5E72\u533A\u56DB\u5468"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "PERIMETER",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSJ-PN-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u536B\u751F\u95F4\u95E8\u5916\uFF0C\u5F00\u95E8\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)\uFF08\u95E8\u5916\uFF09"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)\uFF08\u95E8\u5916\uFF09",
      traceFlags: []
    },
    {
      pointCode: "WSJ-SN-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "toilet",
          "shower"
        ],
        target: "toilet",
        raw: "\u8986\u76D6\u9A6C\u6876/\u6DCB\u6D74"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "WET_ZONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "WSJ-SN-02",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1500
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E72\u533A"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "WET_ZONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSJ-AU-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u5438\u9876\u5587\u53ED",
      deviceCanonical: "\u5438\u9876\u5587\u53ED",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E72\u533A\u4E2D\u5FC3"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSJ-CU-01",
      spaceCode: "WSJ",
      spaceName: "\u536B\u751F\u95F4",
      deviceType2: "\u5377\u5E18\u7535\u673A",
      deviceCanonical: "\u5377\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "GDYT-DL-01",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u7B52\u706F\u4E00\u5B57\u7EC4",
      deviceCanonical: "\u7B52\u706F\u4E00\u5B57\u7EC4",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u8FC7\u9053\u4E2D\u5FC3\u7EBF"
      },
      quantity: {
        kind: "perLength",
        value: 1.5,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(L/1.5))"
      },
      spacing: 1200,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(L/1.5))",
      traceFlags: []
    },
    {
      pointCode: "GDYT-SP-01",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u5C04\u706F\u4E00\u5B57\u7EC4",
      deviceCanonical: "\u5C04\u706F\u4E00\u5B57\u7EC4",
      usage: "\u7AEF\u666F",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "wallOffset",
        offset: 250,
        raw: "\u7AEF\u666F/\u6302\u753B"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "PER_FURNITURE: 1/\u7AEF\u666F"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u7AEF\u666F",
      traceFlags: [
        "GENERIC_COUNT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "GDYT-LS-01",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u8D34\u5899\u706F\u5E26",
      deviceCanonical: "\u8D34\u5899\u706F\u5E26",
      usage: "\u8E22\u811A",
      mount: "SL",
      height: {
        base: "SL",
        offset: 125,
        min: 100,
        max: 150
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8FC7\u9053\u5355\u4FA7\u6216\u53CC\u4FA7"
      },
      quantity: {
        kind: "measuredLength",
        measure: "path",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u8FC7\u9053\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u8FC7\u9053\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "GDYT-LS-02",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5355\u8FB9"
      },
      quantity: {
        kind: "measuredLength",
        measure: "path",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u8FC7\u9053\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u8FC7\u9053\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "GDYT-PN-01",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u8FC7\u9053\u4E24\u7AEF\u95E8\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "GDYT-PN-02",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u65E0\u7EBF\u5F00\u5173",
      deviceCanonical: "\u65E0\u7EBF\u5F00\u5173",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8FC7\u9053\u4E2D\u90E8"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P4",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "GDYT-SN-01",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8986\u76D6\u5168\u6BB5\uFF08\u957F\u8FC7\u9053\u6BCF 6m 1 \u4E2A\uFF09"
      },
      quantity: {
        kind: "perLength",
        value: 6,
        min: 1,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(1, ceil(L/6))"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "BEAM"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: max(1, ceil(L/6))",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "GDYT-AU-01",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u5438\u9876\u5587\u53ED",
      deviceCanonical: "\u5438\u9876\u5587\u53ED",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u8FC7\u9053\u4E2D\u8F74"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "GDYT-CV-01",
      spaceCode: "GDYT",
      spaceName: "\u8FC7\u9053",
      deviceType2: "\u6444\u50CF\u5934",
      deviceCanonical: "\u6444\u50CF\u5934",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5BF9\u51C6\u8FC7\u9053"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YT-DL-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u7B52\u706F / \u7B52\u706F\u4E00\u5B57\u7EC4",
      deviceCanonical: "\u7B52\u706F;\u7B52\u706F\u4E00\u5B57\u7EC4",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u9633\u53F0\u4E2D\u5FC3\u7EBF\u6216\u957F\u8FB9\u4E2D\u8F74"
      },
      quantity: {
        kind: "perLength",
        value: 1.5,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(L/1.5))"
      },
      spacing: 1200,
      priority: "P2",
      collision: [
        "DRYING_RACK"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(L/1.5))",
      traceFlags: []
    },
    {
      pointCode: "YT-PL-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u9762\u677F\u706F",
      deviceCanonical: "\u9762\u677F\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u4F11\u95F2\u533A\u4E2D\u5FC3"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YT-LS-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u706F\u69FD\u706F\u5E26 / \u76F4\u7EBF\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26;\u76F4\u7EBF\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u7A97\u4FA7\u5355\u8FB9"
      },
      quantity: {
        kind: "measuredLength",
        measure: "window",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u7A97\u5BBD/\u9633\u53F0\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DRYING_RACK"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u7A97\u5BBD/\u9633\u53F0\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YT-CB-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "\u6D17\u8863\u673A\u67DC",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YT-PN-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u9633\u53F0\u95E8\u5185\u4FA7\uFF0C\u5F00\u95E8\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "YT-SN-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8986\u76D6\u667E\u6652/\u6D17\u8863\u533A"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DRYING_RACK"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YT-CU-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u7A97\u5E18\u7535\u673A / \u5377\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A;\u5377\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DRYING_RACK"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "YT-AC-01",
      spaceCode: "YT",
      spaceName: "\u9633\u53F0",
      deviceType2: "\u6302\u5F0F\u7A7A\u8C03",
      deviceCanonical: "\u6302\u5F0F\u7A7A\u8C03",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 2200
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u4F11\u95F2\u533A\u4FA7\u5899"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YMJ-DL-01",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u7B52\u706F\u4E00\u5B57\u7EC4",
      deviceCanonical: "\u7B52\u706F\u4E00\u5B57\u7EC4",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u67DC\u4F53\u524D\u901A\u9053\u4E2D\u5FC3\u7EBF"
      },
      quantity: {
        kind: "perLength",
        value: 1.5,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(L/1.5))"
      },
      spacing: 1200,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(L/1.5))",
      traceFlags: []
    },
    {
      pointCode: "YMJ-SP-01",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u67DC\u4F53\u6D17\u5899",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u67DC\u4F53\u524D\u6CBF\u7EBF"
      },
      quantity: {
        kind: "perLength",
        value: 1,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(W/1.0))"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(W/1.0))",
      traceFlags: []
    },
    {
      pointCode: "YMJ-CB-01",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50\uFF1B\u6302\u8863\u6746\u4E0A\u65B9"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F + \u6302\u8863\u6746\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F + \u6302\u8863\u6746\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YMJ-LS-01",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "perimeter",
        offset: 100,
        raw: "\u4E2D\u5C9B\u4E0A\u65B9\u6216\u56DB\u5468"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "PERIMETER",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YMJ-SP-02",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u955C\u524D",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "vanity"
        ],
        target: "vanity",
        raw: "\u7A7F\u8863\u955C\u4E2D\u5FC3"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "PER_FURNITURE: 1/\u955C"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u955C",
      traceFlags: [
        "GENERIC_COUNT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YMJ-PN-01",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u5165\u53E3\u95E8\u5185\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YMJ-PN-02",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u60C5\u666F\u9762\u677F",
      deviceCanonical: "\u60C5\u666F\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u4E0E\u5F00\u5173\u5E76\u6392"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YMJ-SN-01",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u4EBA\u5728\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u5728\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8986\u76D6\u901A\u9053"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "YMJ-SN-02",
      spaceCode: "YMJ",
      spaceName: "\u8863\u5E3D\u95F4",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1500
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8FDC\u79BB\u95E8/\u7A97"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSWSJ-PL-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u9762\u677F\u706F",
      deviceCanonical: "\u9762\u677F\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "inscribedRectCenter",
        raw: "\u5E72\u533A\u6700\u5927\u5185\u63A5\u77E9\u5F62\u4E2D\u5FC3"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "WET_ZONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "WSWSJ-DL-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u7B52\u706F",
      deviceCanonical: "\u7B52\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "shower"
        ],
        target: "shower",
        raw: "\u6DCB\u6D74\u533A/\u6D74\u7F38\u4E0A\u65B9\uFF08\u9632\u6F6E\u578B\uFF09"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "PER_FURNITURE: 1/\u6E7F\u533A"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u6E7F\u533A",
      traceFlags: [
        "GENERIC_COUNT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSWSJ-SP-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u955C\u524D",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "vanity"
        ],
        target: "vanity",
        raw: "\u6D74\u5BA4\u67DC\u4E2D\u5FC3\u6B63\u4E0A\u65B9"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "vanity"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u6D74\u5BA4\u67DC"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "PER_FURNITURE: 1/\u6D74\u5BA4\u67DC",
      traceFlags: []
    },
    {
      pointCode: "WSWSJ-SP-02",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u68B3\u5986",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "vanity"
        ],
        target: "vanity",
        raw: "\u68B3\u5986\u53F0\u4E2D\u5FC3\u6B63\u4E0A\u65B9\uFF0C\u663E\u8272 \u2265Ra90"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 4,
        furnitureTypes: [
          "vanity"
        ],
        raw: "PER_FURNITURE: 1/\u68B3\u5986\u53F0"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_FURNITURE: 1/\u68B3\u5986\u53F0",
      traceFlags: []
    },
    {
      pointCode: "WSWSJ-SP-03",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u9A6C\u6876",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "toilet"
        ],
        target: "toilet",
        raw: "\u9A6C\u6876\u6B63\u4E0A\u65B9\u504F\u524D"
      },
      quantity: {
        kind: "perFurniture",
        value: 1,
        max: 2,
        furnitureTypes: [
          "toilet"
        ],
        min: 0,
        raw: "PER_FURNITURE: 1/\u9A6C\u6876"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_FURNITURE: 1/\u9A6C\u6876",
      traceFlags: []
    },
    {
      pointCode: "WSWSJ-CB-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "\u955C\u67DC",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe",
          "vanity"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF + \u955C\u67DC\u4E0B\u6CBF"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u955C\u67DC\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u955C\u67DC\u5BBD\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSWSJ-CB-02",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "\u68B3\u5986\u53F0",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSWSJ-LS-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u8D34\u5899\u706F\u5E26",
      deviceCanonical: "\u8D34\u5899\u706F\u5E26",
      usage: "\u8D77\u591C\u4F4E\u4F4D",
      mount: "SL",
      height: {
        base: "SL",
        offset: 150,
        min: 100,
        max: 200
      },
      anchor: {
        kind: "pathLine",
        raw: "\u95E8\u6D1E\u5230\u4E3B\u5367\u8DEF\u5F84"
      },
      quantity: {
        kind: "measuredLength",
        measure: "path",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u8DEF\u5F84\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSWSJ-PN-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u536B\u751F\u95F4\u95E8\u5916\uFF0C\u5F00\u95E8\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 2,
        raw: "FIXED(2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(2)",
      traceFlags: []
    },
    {
      pointCode: "WSWSJ-SN-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u4EBA\u4F53\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u4F53\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "toilet",
          "shower"
        ],
        target: "toilet",
        raw: "\u8986\u76D6\u9A6C\u6876/\u6DCB\u6D74"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "WET_ZONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "WSWSJ-SN-02",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      deviceCanonical: "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1500
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E72\u533A"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "WET_ZONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: [
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSWSJ-AU-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u5438\u9876\u5587\u53ED",
      deviceCanonical: "\u5438\u9876\u5587\u53ED",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u5E72\u533A\u4E2D\u5FC3"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "WSWSJ-CU-01",
      spaceCode: "WSWSJ",
      spaceName: "\u5367\u5BA4\u536B\u751F\u95F4",
      deviceType2: "\u5377\u5E18\u7535\u673A",
      deviceCanonical: "\u5377\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    },
    {
      pointCode: "CS-PD-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u540A\u706F",
      deviceCanonical: "\u540A\u706F",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 800,
        min: 750,
        max: 850
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "teaTable"
        ],
        target: "teaTable",
        raw: "**\u8336\u53F0\u51E0\u4F55\u4E2D\u5FC3\u6B63\u4E0A\u65B9**"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "CS-SP-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u8336\u53F0\u91CD\u70B9",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u8336\u53F0\u957F\u8FB9\u4E2D\u70B9/\u4E24\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CS-SP-02",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u5C04\u706F",
      deviceCanonical: "\u5C04\u706F",
      usage: "\u535A\u53E4\u67B6\u6D17\u5899",
      mount: "CL",
      height: {
        base: "CL",
        offset: 150,
        min: 0,
        max: 300
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "displayCabinet"
        ],
        target: "displayCabinet",
        raw: "\u535A\u53E4\u67B6\u524D\u6CBF\u7EBF"
      },
      quantity: {
        kind: "perLength",
        value: 1,
        min: 2,
        even: false,
        round: "ceil",
        raw: "PER_LENGTH: max(2, ceil(W/1.0))"
      },
      spacing: 800,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_LENGTH: max(2, ceil(W/1.0))",
      traceFlags: []
    },
    {
      pointCode: "CS-LS-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u706F\u69FD\u706F\u5E26",
      deviceCanonical: "\u706F\u69FD\u706F\u5E26",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "perimeter",
        offset: 100,
        raw: "\u56DB\u5468\u6216\u5355\u8FB9"
      },
      quantity: {
        kind: "measuredLength",
        measure: "perimeter",
        factor: 1.05,
        raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "SINGLE_SIDE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u8DEF\u5F84\u957F \xD7 1.05",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "PERIMETER",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CS-CB-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u67DC\u4F53\u706F\u5E26",
      deviceCanonical: "\u67DC\u4F53\u706F\u5E26",
      usage: "",
      mount: "BL",
      height: {
        base: "BL",
        offset: 0
      },
      anchor: {
        kind: "furnitureEdge",
        furnitureTypes: [
          "wardrobe"
        ],
        target: "wardrobe",
        raw: "\u5C42\u677F\u524D\u6CBF\u5185\u7F29 50"
      },
      quantity: {
        kind: "measuredLength",
        measure: "cabinet",
        factor: 1,
        raw: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09"
      },
      spacing: 0,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "PER_MEASURED_LENGTH: \u67DC\u5185\u5C42\u677F\u603B\u957F\uFF08\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF09",
      traceFlags: [
        "MEASURED_AFTER_LAYOUT",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CS-WL-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u58C1\u706F",
      deviceCanonical: "\u58C1\u706F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300,
        min: 1200,
        max: 1400
      },
      anchor: {
        kind: "roomCenter",
        raw: "\u80CC\u666F\u5899\u4E24\u4FA7\u5BF9\u79F0"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 0,
        raw: "FIXED(0~2)"
      },
      spacing: 0,
      priority: "P4",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "GENERIC_ANCHOR",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CS-PN-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u5F00\u5173\u9762\u677F",
      deviceCanonical: "\u5F00\u5173\u9762\u677F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u8336\u5BA4\u95E8\u5185\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 1,
        raw: "FIXED(1~2)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "DOOR_SWING"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(1~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CS-PN-02",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u60C5\u666F\u9762\u677F",
      deviceCanonical: "\u60C5\u666F\u9762\u677F",
      usage: "\u8336\u53D9/\u5F85\u5BA2",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1300
      },
      anchor: {
        kind: "doorSideWall",
        offset: 175,
        raw: "\u4E0E\u5F00\u5173\u5E76\u6392"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "CS-PN-03",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u4E2D\u63A7\u5C4F",
      deviceCanonical: "\u4E2D\u63A7\u5C4F",
      usage: "",
      mount: "SL",
      height: {
        base: "SL",
        offset: 1400
      },
      anchor: {
        kind: "wallOffset",
        offset: 300,
        raw: "\u8336\u5BA4\u4E3B\u5899\u9762"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 0,
        raw: "FIXED(0~1)"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REMOVE"
      ],
      sourceText: "FIXED(0~1)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CS-SN-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u4EBA\u5728\u4F20\u611F\u5668",
      deviceCanonical: "\u4EBA\u5728\u4F20\u611F\u5668",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "furnitureCenter",
        furnitureTypes: [
          "teaTable"
        ],
        target: "teaTable",
        raw: "\u8986\u76D6\u8336\u53F0+\u5750\u5E2D"
      },
      quantity: {
        kind: "fixed",
        value: 1,
        min: 1,
        raw: "FIXED(1)"
      },
      spacing: 0,
      priority: "P1",
      collision: [
        "NONE"
      ],
      fallback: [
        "ALTERNATE_DEVICE"
      ],
      sourceText: "FIXED(1)",
      traceFlags: []
    },
    {
      pointCode: "CS-AU-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u5438\u9876\u5587\u53ED",
      deviceCanonical: "\u5438\u9876\u5587\u53ED",
      usage: "",
      mount: "CL",
      height: {
        base: "CL",
        offset: 0
      },
      anchor: {
        kind: "longAxisLine",
        raw: "\u8336\u5BA4\u4E2D\u8F74\u4E24\u4FA7"
      },
      quantity: {
        kind: "fixed",
        value: 2,
        min: 0,
        raw: "FIXED(0~2)"
      },
      spacing: 1500,
      priority: "P3",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "FIXED(0~2)",
      traceFlags: [
        "OPTIONAL_OR_RANGE",
        "DEMO_DEFAULT"
      ]
    },
    {
      pointCode: "CS-CU-01",
      spaceCode: "CS",
      spaceName: "\u8336\u5BA4",
      deviceType2: "\u7A97\u5E18\u7535\u673A",
      deviceCanonical: "\u7A97\u5E18\u7535\u673A",
      usage: "",
      mount: "WL",
      height: {
        base: "WL",
        offset: 0
      },
      anchor: {
        kind: "windowHead",
        raw: "\u6BCF\u7A97"
      },
      quantity: {
        kind: "perOpening",
        value: 1,
        target: "window",
        raw: "PER_OPENING"
      },
      spacing: 0,
      priority: "P2",
      collision: [
        "NONE"
      ],
      fallback: [
        "REDUCE"
      ],
      sourceText: "PER_OPENING",
      traceFlags: []
    }
  ];

  // src/data/catalog.ts
  var SPACES = [
    { code: "KT", name: "\u5BA2\u5385", defaultMode: "MIXED", zones: ["\u6C99\u53D1\u533A", "\u8336\u51E0\u533A", "\u7535\u89C6\u5899", "\u901A\u884C\u533A", "\u7AEF\u666F"] },
    { code: "CT", name: "\u9910\u5385", defaultMode: "MAIN", zones: ["\u9910\u684C\u533A", "\u9910\u8FB9\u67DC\u533A", "\u901A\u884C\u533A"] },
    { code: "ZW", name: "\u4E3B\u5367", defaultMode: "MIXED", zones: ["\u5E8A\u533A", "\u5E8A\u5934\u4E24\u4FA7", "\u8863\u67DC\u533A", "\u68B3\u5986/\u98D8\u7A97\u533A", "\u901A\u884C\u533A"] },
    { code: "SF", name: "\u4E66\u623F", defaultMode: "MIXED", zones: ["\u4E66\u684C\u533A", "\u4E66\u67DC\u533A", "\u5EA7\u6905\u6D3B\u52A8\u533A"] },
    { code: "WS", name: "\u5367\u5BA4", defaultMode: "MAIN", zones: ["\u5E8A\u533A", "\u5E8A\u5934\u4E24\u4FA7", "\u8863\u67DC\u533A", "\u901A\u884C\u533A"] },
    { code: "LRF", name: "\u8001\u4EBA\u623F", defaultMode: "MAIN", zones: ["\u5E8A\u533A", "\u5E8A\u5934\u4E24\u4FA7", "\u8D77\u591C\u8DEF\u5F84", "\u901A\u884C\u533A"] },
    { code: "XHF", name: "\u513F\u7AE5\u623F", defaultMode: "MAIN", zones: ["\u5E8A\u533A", "\u5B66\u4E60\u684C\u533A", "\u73A9\u800D\u533A", "\u8863\u67DC\u533A"] },
    { code: "XCW", name: "\u7384\u5173", defaultMode: "NO_MAIN", zones: ["\u5165\u6237\u95E8\u5185\u4FA7", "\u6362\u978B\u533A", "\u978B\u67DC\u533A", "\u7AEF\u666F\u533A"] },
    { code: "CF", name: "\u53A8\u623F", defaultMode: "NO_MAIN", zones: ["\u64CD\u4F5C\u53F0", "\u540A\u67DC\u4E0B", "\u5C9B\u53F0/\u5427\u53F0", "\u51B0\u7BB1\u4F4D"] },
    { code: "WSJ", name: "\u536B\u751F\u95F4", defaultMode: "NO_MAIN", zones: ["\u9A6C\u6876", "\u6D74\u5BA4\u67DC/\u955C\u524D", "\u6DCB\u6D74\u623F/\u6D74\u7F38"] },
    { code: "GDYT", name: "\u8FC7\u9053", defaultMode: "NO_MAIN", zones: ["\u901A\u884C\u5E26", "\u95E8\u6D1E\u5E8F\u5217", "\u7AEF\u666F"] },
    { code: "YT", name: "\u9633\u53F0", defaultMode: "NO_MAIN", zones: ["\u667E\u6652\u533A", "\u4F11\u95F2\u533A", "\u6D17\u8863\u673A\u67DC"] },
    { code: "YMJ", name: "\u8863\u5E3D\u95F4", defaultMode: "NO_MAIN", zones: ["\u67DC\u4F53\u533A", "\u6362\u8863/\u4E2D\u5C9B\u533A", "\u955C\u524D"] },
    { code: "WSWSJ", name: "\u5367\u5BA4\u536B\u751F\u95F4", defaultMode: "NO_MAIN", zones: ["\u9A6C\u6876", "\u6D74\u5BA4\u67DC/\u955C\u524D", "\u6DCB\u6D74/\u6D74\u7F38", "\u68B3\u5986\u4F4D"] },
    { code: "CS", name: "\u8336\u5BA4", defaultMode: "MAIN", zones: ["\u8336\u53F0\u533A", "\u5750\u5E2D\u533A", "\u5C55\u793A/\u535A\u53E4\u67B6"] }
  ];
  var SPACE_BY_CODE = Object.fromEntries(SPACES.map((s) => [s.code, s]));
  var RAW_DEVICES = [
    ["\u706F\u5149", "\u7B52\u706F"],
    ["\u706F\u5149", "\u5C04\u706F"],
    ["\u706F\u5149", "\u5438\u9876\u706F"],
    ["\u706F\u5149", "\u540A\u706F"],
    ["\u706F\u5149", "\u9762\u677F\u706F"],
    ["\u706F\u5149", "\u683C\u6805\u706F"],
    ["\u706F\u5149", "\u58C1\u706F"],
    ["\u706F\u5149", "\u843D\u5730\u706F"],
    ["\u706F\u5149", "\u53F0\u706F", true],
    ["\u706F\u5149", "\u76F4\u7EBF\u706F\u5E26"],
    ["\u706F\u5149", "\u8D34\u5899\u706F\u5E26"],
    ["\u706F\u5149", "L \u578B\u706F\u5E26"],
    ["\u706F\u5149", "U \u578B\u706F\u5E26"],
    ["\u706F\u5149", "\u53E3\u5B57\u706F\u5E26"],
    ["\u706F\u5149", "\u5C04\u706F\u4E00\u5B57\u7EC4"],
    ["\u706F\u5149", "\u7B52\u706F\u4E00\u5B57\u7EC4"],
    ["\u706F\u5149", "\u7B52\u706F\u53E3\u5B57\u7EC4"],
    ["\u706F\u5149", "\u8F68\u9053\u5C04\u706F \xB7 \u706F\u5934"],
    ["\u706F\u5149", "\u8F68\u9053\u5C04\u706F \xB7 \u8F68\u9053"],
    ["\u706F\u5149", "\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u706F\u4F53"],
    ["\u706F\u5149", "\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u78C1\u5438\u8F68\u9053"],
    ["\u706F\u5149", "\u78C1\u5438\u683C\u6805\u706F \xB7 \u706F\u4F53"],
    ["\u706F\u5149", "\u78C1\u5438\u683C\u6805\u706F \xB7 \u78C1\u5438\u8F68\u9053"],
    ["\u706F\u5149", "\u706F\u69FD\u706F\u5E26"],
    ["\u706F\u5149", "\u7A97\u5E18\u706F\u5E26"],
    ["\u706F\u5149", "\u67DC\u4F53\u706F\u5E26"],
    ["\u63A7\u5236", "\u5F00\u5173\u9762\u677F"],
    ["\u63A7\u5236", "\u60C5\u666F\u9762\u677F"],
    ["\u63A7\u5236", "\u65E0\u7EBF\u5F00\u5173"],
    ["\u63A7\u5236", "\u8C03\u5149\u65CB\u94AE"],
    ["\u63A7\u5236", "\u4E2D\u63A7\u5C4F"],
    ["\u73AF\u5883", "\u4EBA\u4F53\u4F20\u611F\u5668"],
    ["\u73AF\u5883", "\u4EBA\u5728\u4F20\u611F\u5668"],
    ["\u73AF\u5883", "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668"],
    ["\u73AF\u5883", "\u5149\u7167\u4F20\u611F\u5668"],
    ["\u5B89\u9632\u76D1\u63A7", "\u6444\u50CF\u5934"],
    ["\u5B89\u9632\u76D1\u63A7", "\u667A\u80FD\u95E8\u9501"],
    ["\u7F51\u7EDC", "\u84DD\u7259 Mesh \u7F51\u5173"],
    ["\u7F51\u7EDC", "Mesh \u8DEF\u7531\u5668"],
    ["\u7F51\u7EDC", "\u9876\u88C5 AP"],
    ["\u7F51\u7EDC", "\u5F31\u7535\u7BB1 \xB7 \u7BB1\u4F53"],
    ["\u7F51\u7EDC", "\u5F31\u7535\u7BB1 \xB7 PoE \u8DEF\u7531"],
    ["\u7F51\u7EDC", "\u5F31\u7535\u7BB1 \xB7 Mesh \u4E3B\u8DEF\u7531"],
    ["\u7F51\u7EDC", "\u5F31\u7535\u7BB1 \xB7 PoE \u4EA4\u6362\u673A"],
    ["\u7F51\u7EDC", "\u5F31\u7535\u7BB1 \xB7 \u4EA4\u6362\u673A"],
    ["\u7F51\u7EDC", "\u4EA4\u6362\u673A"],
    ["\u7F51\u7EDC", "\u7F51\u53E3\u9762\u677F"],
    ["\u7F51\u7EDC", "\u9762\u677F AP"],
    ["\u97F3\u4E50", "\u667A\u80FD\u97F3\u7BB1"],
    ["\u97F3\u4E50", "\u5438\u9876\u5587\u53ED"],
    ["\u906E\u9633", "\u7A97\u5E18\u7535\u673A"],
    ["\u906E\u9633", "\u7A97\u5E18\u7535\u673A \xB7 \u7535\u52A8\u8F68\u9053"],
    ["\u906E\u9633", "\u5377\u5E18\u7535\u673A"],
    ["\u6696\u901A", "\u6302\u5F0F\u7A7A\u8C03"],
    ["\u6696\u901A", "\u67DC\u5F0F\u7A7A\u8C03"]
  ];
  function iconFor(cat, name) {
    if (name === "\u7B52\u706F") return "downlight";
    if (name === "\u5C04\u706F") return "spotlight";
    if (name === "\u5438\u9876\u706F") return "ceiling";
    if (name === "\u540A\u706F") return "pendant";
    if (name === "\u9762\u677F\u706F") return "panel";
    if (name === "\u683C\u6805\u706F") return "grille";
    if (name === "\u58C1\u706F") return "wallLamp";
    if (name === "\u843D\u5730\u706F") return "floorLamp";
    if (name === "\u53F0\u706F") return "tableLamp";
    if (name.includes("L \u578B")) return "stripL";
    if (name.includes("U \u578B")) return "stripU";
    if (name.includes("\u53E3\u5B57")) return "stripSquare";
    if (name.includes("\u8F68\u9053")) return name.includes("\u706F\u5934") ? "trackHead" : "track";
    if (name.includes("\u78C1\u5438") && name.includes("\u706F\u4F53")) return "magneticBody";
    if (name.includes("\u706F\u5E26")) return "strip";
    if (name.includes("\u4E00\u5B57\u7EC4")) return "array";
    if (name === "\u5F00\u5173\u9762\u677F") return "switch";
    if (name === "\u60C5\u666F\u9762\u677F") return "scenePanel";
    if (name === "\u65E0\u7EBF\u5F00\u5173") return "wirelessSwitch";
    if (name === "\u8C03\u5149\u65CB\u94AE") return "knob";
    if (name === "\u4E2D\u63A7\u5C4F") return "screen";
    if (name === "\u4EBA\u4F53\u4F20\u611F\u5668") return "pir";
    if (name === "\u4EBA\u5728\u4F20\u611F\u5668") return "presence";
    if (name === "\u6E29\u6E7F\u5EA6\u4F20\u611F\u5668") return "temp";
    if (name === "\u5149\u7167\u4F20\u611F\u5668") return "lux";
    if (name === "\u6444\u50CF\u5934") return "camera";
    if (name === "\u667A\u80FD\u95E8\u9501") return "lock";
    if (name.includes("\u5F31\u7535\u7BB1")) return name.includes("PoE") ? "poeBox" : "weakBox";
    if (name.includes("\u4EA4\u6362\u673A")) return "switchBox";
    if (name.includes("AP")) return "ap";
    if (name.includes("\u8DEF\u7531\u5668")) return "router";
    if (name.includes("\u7F51\u5173")) return "gateway";
    if (name.includes("\u7F51\u53E3")) return "ethernet";
    if (name === "\u667A\u80FD\u97F3\u7BB1") return "speaker";
    if (name === "\u5438\u9876\u5587\u53ED") return "ceilingSpeaker";
    if (name.includes("\u5377\u5E18")) return "roller";
    if (name.includes("\u7A97\u5E18")) return "curtain";
    if (name.includes("\u7A7A\u8C03")) return name.includes("\u67DC\u5F0F") ? "acFloor" : "acWall";
    return cat === "\u706F\u5149" ? "downlight" : "generic";
  }
  function glowFor(cat, name) {
    if (cat !== "\u706F\u5149") return "none";
    if (name.includes("\u706F\u5E26") || name.includes("\u8F68\u9053")) return "line";
    if (name.includes("\u9762\u677F\u706F") || name.includes("\u683C\u6805\u706F") || name.includes("\u53E3\u5B57")) return "area";
    if (name.includes("\u5C04\u706F") && !name.includes("\u4E00\u5B57\u7EC4")) return "fan";
    if (name === "\u58C1\u706F") return "point";
    return "point";
  }
  function visualFor(cat, name) {
    if (name.includes("\u53E3\u5B57\u706F\u5E26")) return "rect";
    if (name.includes("L \u578B\u706F\u5E26")) return "l";
    if (name.includes("U \u578B\u706F\u5E26")) return "u";
    if (name.includes("\u706F\u5E26") || name.includes("\u706F\u69FD")) return "line";
    if (name.includes("\u8F68\u9053")) return "track";
    if (name.includes("\u4E00\u5B57\u7EC4")) return "array";
    if (name.includes("\u53E3\u5B57\u7EC4")) return "pointRect";
    if (cat === "\u706F\u5149") return "point";
    return "none";
  }
  function mountFor(cat, name) {
    if (name.includes("\u7A97\u5E18") || name.includes("\u5377\u5E18")) return "WL";
    if (name.includes("\u67DC\u4F53") || name.includes("\u706F\u69FD")) return "BL";
    if (name === "\u843D\u5730\u706F" || name === "\u67DC\u5F0F\u7A7A\u8C03" || name === "\u667A\u80FD\u97F3\u7BB1") return "FL";
    if (name === "\u53F0\u706F") return "BL";
    if (cat === "\u706F\u5149") return "CL";
    if (name === "\u667A\u80FD\u95E8\u9501") return "SL";
    if (name === "\u7F51\u53E3\u9762\u677F" || name === "\u9762\u677F AP") return "SL";
    if (name === "\u6302\u5F0F\u7A7A\u8C03") return "SL";
    if (name === "\u5F31\u7535\u7BB1 \xB7 \u7BB1\u4F53") return "SL";
    if (cat === "\u73AF\u5883" || cat === "\u5B89\u9632\u76D1\u63A7" || cat === "\u63A7\u5236") return "SL";
    return "CL";
  }
  function sizeFor(name) {
    if (name.includes("\u53E3\u5B57\u706F\u5E26")) return { width: 1600, depth: 1200 };
    if (name.includes("L \u578B\u706F\u5E26") || name.includes("U \u578B\u706F\u5E26")) return { width: 1400, depth: 900 };
    if (name.includes("\u4E00\u5B57\u7EC4")) return { width: 1200, depth: 120 };
    if (name.includes("\u53E3\u5B57\u7EC4")) return { width: 1e3, depth: 1e3 };
    if (name.includes("\u706F\u5E26") || name.includes("\u8F68\u9053")) return { width: 1200, depth: 60 };
    if (name === "\u9762\u677F\u706F") return { width: 600, depth: 600 };
    if (name === "\u683C\u6805\u706F") return { width: 240, depth: 120 };
    if (name === "\u5438\u9876\u706F") return { width: 500, depth: 500 };
    if (name === "\u540A\u706F") return { width: 500, depth: 500 };
    if (name === "\u7B52\u706F") return { width: 90, depth: 90 };
    if (name === "\u5C04\u706F") return { width: 75, depth: 75 };
    if (name === "\u58C1\u706F") return { width: 260, depth: 160 };
    if (name === "\u843D\u5730\u706F") return { width: 400, depth: 400 };
    if (name === "\u53F0\u706F") return { width: 280, depth: 280 };
    if (name === "\u5F00\u5173\u9762\u677F" || name === "\u60C5\u666F\u9762\u677F") return { width: 86, depth: 86 };
    if (name === "\u4E2D\u63A7\u5C4F") return { width: 220, depth: 120 };
    if (name === "\u6444\u50CF\u5934") return { width: 120, depth: 120 };
    if (name === "\u667A\u80FD\u95E8\u9501") return { width: 80, depth: 160 };
    if (name === "\u7A97\u5E18\u7535\u673A") return { width: 120, depth: 120 };
    if (name === "\u6302\u5F0F\u7A7A\u8C03") return { width: 900, depth: 250 };
    if (name === "\u67DC\u5F0F\u7A7A\u8C03") return { width: 500, depth: 500 };
    return { width: 180, depth: 180 };
  }
  function roleFor(cat, name) {
    if (cat === "\u706F\u5149") {
      if (name.includes("\u706F\u5E26") || name.includes("\u706F\u69FD")) return "\u6C1B\u56F4\u7167\u660E";
      if (name.includes("\u5C04\u706F") || name.includes("\u8F68\u9053") || name.includes("\u78C1\u5438")) return "\u91CD\u70B9\u7167\u660E";
      return "\u57FA\u7840\u7167\u660E";
    }
    if (cat === "\u63A7\u5236") return "\u4EA4\u4E92\u63A7\u5236";
    if (cat === "\u73AF\u5883") return "\u73AF\u5883\u611F\u77E5";
    if (cat === "\u5B89\u9632\u76D1\u63A7") return "\u5B89\u9632";
    if (cat === "\u7F51\u7EDC") return "\u7F51\u7EDC\u57FA\u7840\u8BBE\u65BD";
    if (cat === "\u97F3\u4E50") return "\u80CC\u666F\u97F3\u4E50";
    if (cat === "\u906E\u9633") return "\u906E\u9633";
    return "\u6696\u901A";
  }
  function familyMetaFor(category2, mount) {
    const surface = mount === "CL" ? "ceiling" : mount === "WL" ? "curtain_box" : mount === "FL" ? "floor" : mount === "BL" ? "cabinet" : "wall";
    if (category2 === "\u76F4\u7EBF\u706F\u5E26") return { productFamily: "\u706F\u5E26", mountSurface: surface, routeShape: "straight", application: "general", salesUnit: "meter" };
    if (category2 === "\u8D34\u5899\u706F\u5E26") return { productFamily: "\u706F\u5E26", mountSurface: "wall", routeShape: "straight", application: "wash_wall", salesUnit: "meter" };
    if (category2 === "L \u578B\u706F\u5E26") return { productFamily: "\u706F\u5E26", mountSurface: surface, routeShape: "L", application: "general", salesUnit: "meter" };
    if (category2 === "U \u578B\u706F\u5E26") return { productFamily: "\u706F\u5E26", mountSurface: surface, routeShape: "U", application: "general", salesUnit: "meter" };
    if (category2 === "\u53E3\u5B57\u706F\u5E26") return { productFamily: "\u706F\u5E26", mountSurface: surface, routeShape: "rectangle", application: "general", salesUnit: "meter" };
    if (category2 === "\u5C04\u706F\u4E00\u5B57\u7EC4") return { productFamily: "\u5C04\u706F", mountSurface: surface, layoutForm: "line", salesUnit: "group" };
    if (category2 === "\u7B52\u706F\u4E00\u5B57\u7EC4") return { productFamily: "\u7B52\u706F", mountSurface: surface, layoutForm: "line", salesUnit: "group" };
    if (category2 === "\u7B52\u706F\u53E3\u5B57\u7EC4") return { productFamily: "\u7B52\u706F", mountSurface: surface, layoutForm: "rectangle", salesUnit: "group" };
    if (category2 === "\u706F\u69FD\u706F\u5E26") return { productFamily: "\u706F\u69FD\u706F\u5E26", mountSurface: "cove", routeShape: "free", application: "cove", salesUnit: "meter" };
    if (category2 === "\u7A97\u5E18\u706F\u5E26") return { productFamily: "\u7A97\u5E18\u706F\u5E26", mountSurface: "curtain_box", routeShape: "straight", application: "curtain_box", salesUnit: "meter" };
    if (category2 === "\u67DC\u4F53\u706F\u5E26") return { productFamily: "\u67DC\u4F53\u706F\u5E26", mountSurface: "cabinet", routeShape: "free", application: "cabinet", salesUnit: "meter" };
    if (category2.includes("\u7A97\u5E18\u7535\u673A")) return { productFamily: category2, mountSurface: "curtain_box", layoutForm: "single", salesUnit: category2.includes("\u8F68\u9053") ? "meter" : "piece" };
    if (category2.includes("\u8F68\u9053")) return { productFamily: category2, mountSurface: "track", layoutForm: "single", salesUnit: "meter" };
    return { productFamily: category2, mountSurface: surface, layoutForm: "single", salesUnit: "piece" };
  }
  var DEVICES = RAW_DEVICES.map(([category1, category2, demoExtension]) => {
    const mount = mountFor(category1, category2);
    return {
      key: category2,
      category1,
      category2,
      legacyType2: category2,
      ...familyMetaFor(category2, mount),
      aliases: [category2],
      icon: iconFor(category1, category2),
      visual: visualFor(category1, category2),
      glow: glowFor(category1, category2),
      mount,
      size: sizeFor(category2),
      role: roleFor(category1, category2),
      demoExtension
    };
  });
  var DEVICE_BY_KEY = Object.fromEntries(DEVICES.map((d) => [d.key, d]));
  var CATEGORY_ORDER = ["\u706F\u5149", "\u63A7\u5236", "\u73AF\u5883", "\u5B89\u9632\u76D1\u63A7", "\u7F51\u7EDC", "\u97F3\u4E50", "\u906E\u9633", "\u6696\u901A"];
  var DEVICES_BY_CATEGORY = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    devices: DEVICES.filter((d) => d.category1 === cat)
  }));
  function findDevice(name) {
    return DEVICES.find((d) => d.category2 === name || d.aliases.includes(name));
  }

  // src/data/cross-rules.ts
  var CAT_CODE = {
    \u706F\u5149: "LT",
    \u63A7\u5236: "CT",
    \u73AF\u5883: "EN",
    \u5B89\u9632\u76D1\u63A7: "SC",
    \u7F51\u7EDC: "NW",
    \u97F3\u4E50: "MU",
    \u906E\u9633: "SH",
    \u6696\u901A: "HV"
  };
  function anchorFor(def) {
    const n = def.category2;
    if (def.category1 === "\u63A7\u5236") {
      return { kind: "doorSideWall", offset: 175, raw: "\u95E8\u5185\u4FA7\u3001\u5F00\u95E8\u4FA7\u5899\u9762\uFF0C\u8DDD\u95E8\u5957 150~200" };
    }
    if (def.category1 === "\u906E\u9633") {
      return { kind: "windowHead", raw: "\u7A97\u5E18\u76D2\u5185 / \u7A97\u9876" };
    }
    if (def.category1 === "\u6696\u901A") {
      return { kind: "wallOffset", offset: 350, raw: "\u6CBF\u5899\u9000\u8DDD 350\uFF0C\u907F\u5F00\u4EBA\u5458\u6D3B\u52A8\u533A" };
    }
    if (def.category1 === "\u97F3\u4E50") {
      return n.includes("\u5438\u9876") ? { kind: "roomCenter", raw: "\u7A7A\u95F4\u4E2D\u5FC3\uFF0C\u907F\u5F00\u4E3B\u706F" } : { kind: "furnitureCenter", furnitureTypes: ["sofa", "teaTable", "diningTable"], raw: "\u4E3B\u8981\u505C\u7559\u70B9\u9644\u8FD1" };
    }
    if (def.category1 === "\u7F51\u7EDC") {
      if (["\u9876\u88C5 AP", "Mesh \u8DEF\u7531\u5668", "\u9762\u677F AP"].includes(n)) {
        return { kind: "inscribedRectCenter", raw: "\u7A7A\u95F4\u51E0\u4F55\u4E2D\u5FC3 / \u9AD8\u5904\uFF0C\u8986\u76D6\u4F18\u5148" };
      }
      return { kind: "wallOffset", offset: n.includes("\u5F31\u7535\u7BB1") ? 300 : 200, raw: "\u7384\u5173/\u8FC7\u9053\u5F31\u7535\u7BB1\u6216\u5899\u9762\u7F51\u53E3\u4F4D" };
    }
    if (def.category1 === "\u5B89\u9632\u76D1\u63A7") {
      return n.includes("\u95E8\u9501") ? { kind: "doorSideWall", offset: 120, raw: "\u5165\u6237\u95E8\u5185\u4FA7" } : { kind: "wallOffset", offset: 200, raw: "\u5899\u89D2\u9AD8\u5904\uFF0C\u8986\u76D6\u5165\u53E3" };
    }
    if (def.category1 === "\u73AF\u5883") {
      if (n.includes("\u4EBA\u4F53") || n.includes("\u4EBA\u5728")) return { kind: "roomCenter", raw: "\u4E3B\u8981\u505C\u7559\u533A / \u5165\u53E3\u4E0A\u65B9" };
      return { kind: "wallOffset", offset: 1500, raw: "\u8FDC\u79BB\u70ED\u6E90\u3001\u7A97\u3001\u7076\u53F0\u3001\u6DCB\u6D74" };
    }
    if (n.includes("\u706F\u69FD") || n.includes("\u8D34\u5899") || n.includes("\u76F4\u7EBF\u706F\u5E26")) {
      return { kind: "perimeter", offset: 120, raw: "\u6CBF\u623F\u95F4\u5468\u5708 / \u80CC\u666F\u5899" };
    }
    if (n.includes("\u67DC\u4F53")) {
      return {
        kind: "cabinetShelf",
        furnitureTypes: ["wardrobe", "upperCabinet", "bookshelf", "displayCabinet", "shoeCabinet"],
        raw: "\u67DC\u5185\u5C42\u677F\u524D\u6CBF / \u540A\u67DC\u5E95\u9762"
      };
    }
    if (n.includes("\u7A97\u5E18")) {
      return { kind: "windowHead", raw: "\u7A97\u5E18\u76D2\u5185\u6CBF" };
    }
    if (n.includes("\u8F68\u9053") || n.includes("\u78C1\u5438")) {
      return { kind: "furnitureEdge", furnitureTypes: ["tvCabinet", "sofa"], raw: "\u7535\u89C6\u5899 / \u6C99\u53D1\u957F\u8F74\u5E73\u884C\u8F74" };
    }
    if (n.includes("L \u578B") || n.includes("U \u578B") || n.includes("\u53E3\u5B57") || n.includes("\u4E00\u5B57\u7EC4")) {
      return { kind: "roomCenter", raw: "\u7EC4\u5408\u706F\u5F62\u6574\u4F53\u4E2D\u5FC3" };
    }
    if (["\u5438\u9876\u706F", "\u540A\u706F", "\u9762\u677F\u706F", "\u683C\u6805\u706F"].includes(n)) {
      return { kind: "inscribedRectCenter", raw: "\u7A7A\u95F4\u51E0\u4F55\u4E2D\u5FC3" };
    }
    if (n === "\u7B52\u706F") {
      return { kind: "inscribedGrid", rows: 2, rowGap: 500, colGap: 800, raw: "\u5185\u63A5\u77E9\u5F62\u53CC\u5217\u7F51\u683C" };
    }
    if (n === "\u5C04\u706F") {
      return { kind: "wallOffset", offset: 300, raw: "\u6CBF\u5899 / \u76EE\u6807\u4E0A\u65B9" };
    }
    if (n === "\u58C1\u706F") {
      return { kind: "furnitureEdge", furnitureTypes: ["bed", "nightstand"], raw: "\u5E8A\u5934\u80CC\u666F\u5899\u4E24\u4FA7" };
    }
    if (n === "\u53F0\u706F" || n === "\u843D\u5730\u706F") {
      return { kind: "furnitureCenter", furnitureTypes: ["nightstand", "desk", "sofa"], raw: "\u5E8A\u5934\u67DC / \u4E66\u684C / \u6C99\u53D1\u4FA7" };
    }
    return { kind: "roomCenter", raw: "\u623F\u95F4\u4E2D\u5FC3" };
  }
  function quantityFor(def) {
    const n = def.category2;
    if (def.category1 === "\u906E\u9633") {
      return { kind: "perOpening", value: 1, target: "window", raw: "PER_OPENING: 1/\u7A97" };
    }
    if (def.glow === "line" || n.includes("\u706F\u5E26") || n.includes("\u8F68\u9053") || n.includes("\u78C1\u5438")) {
      const measure = n.includes("\u67DC\u4F53") ? "cabinet" : n.includes("\u7A97\u5E18") ? "window" : n.includes("\u8F68\u9053") || n.includes("\u78C1\u5438") ? "track" : "perimeter";
      return { kind: "measuredLength", measure, value: measure === "track" ? 1 : void 0, raw: "PER_MEASURED_LENGTH: \u5E03\u7F6E\u540E\u5B9E\u6D4B" };
    }
    return { kind: "fixed", value: 1, raw: "FIXED(1)" };
  }
  function heightFor(def) {
    const n = def.category2;
    if (def.category1 === "\u63A7\u5236") return { base: "SL", offset: 1300 };
    if (def.category1 === "\u906E\u9633") return { base: "WL", offset: 0 };
    if (def.category1 === "\u6696\u901A") return { base: "SL", offset: 2200 };
    if (def.category1 === "\u5B89\u9632\u76D1\u63A7") return n.includes("\u95E8\u9501") ? { base: "SL", offset: 1200 } : { base: "SL", offset: 2200 };
    if (def.category1 === "\u73AF\u5883") {
      return n.includes("\u4EBA\u4F53") || n.includes("\u4EBA\u5728") ? { base: "CL", offset: 0 } : { base: "SL", offset: 1300 };
    }
    if (def.category1 === "\u97F3\u4E50") return n.includes("\u5438\u9876") ? { base: "CL", offset: 0 } : { base: "SL", offset: 800 };
    if (def.category1 === "\u7F51\u7EDC") {
      return n.includes("AP") || n.includes("Mesh") ? { base: "CL", offset: 0 } : { base: "SL", offset: 300 };
    }
    if (def.mount === "CL") return { base: "CL", offset: 0 };
    if (def.mount === "BL") return { base: "BL", offset: 100 };
    if (def.mount === "FL") return { base: "FL", offset: 0 };
    if (def.mount === "WL") return { base: "WL", offset: 0 };
    return { base: "SL", offset: 1300 };
  }
  function priorityFor(def) {
    if (def.category1 === "\u63A7\u5236") return "P1";
    if (def.category2 === "\u5C04\u706F" || def.category2 === "\u58C1\u706F") return "P1";
    if (def.category1 === "\u73AF\u5883" || def.category1 === "\u97F3\u4E50") return "P3";
    if (def.category1 === "\u706F\u5149" && (def.glow === "line" || def.category2.includes("\u706F\u5E26"))) return "P3";
    return "P2";
  }
  var CROSS_RULE_TEMPLATES = DEVICES.map((def) => {
    const index = DEVICES.filter((d) => d.category1 === def.category1).indexOf(def) + 1;
    const height = heightFor(def);
    return {
      pointCode: `GEN-${CAT_CODE[def.category1]}-${String(index).padStart(2, "0")}`,
      deviceKey: def.key,
      deviceType2: def.category2,
      deviceCanonical: def.key,
      usage: def.role || "\u8DE8\u7A7A\u95F4\u901A\u7528\u5E03\u70B9",
      mount: height.base,
      height,
      anchor: anchorFor(def),
      quantity: quantityFor(def),
      spacing: def.category1 === "\u63A7\u5236" ? 100 : def.category1 === "\u73AF\u5883" ? 0 : 300,
      priority: priorityFor(def),
      collision: ["DOOR_SWING", "WINDOW"],
      fallback: ["REDUCE", "REMOVE"],
      sourceText: "\u8DE8\u7A7A\u95F4\u901A\u7528\u89C4\u5219\uFF08\u6309\u8BBE\u5907\u7C7B\u578B\uFF09",
      traceFlags: ["CROSS_SPACE_RULE"]
    };
  });
  var CROSS_RULE_BY_CODE = new Map(CROSS_RULE_TEMPLATES.map((r) => [r.pointCode, r]));

  // src/data/defaults.ts
  var DEMO_DEFAULTS = {
    ruleVersion: "2026-10-21-V1",
    engineVersion: "0.1.0",
    downlight: { rows: 2, rowGap: 500, colGap: 800, wallClearance: 300 },
    spotlight: { min: 4, noTargetFallback: false },
    modes: {
      KT: "MIXED",
      CT: "MAIN",
      ZW: "MIXED",
      SF: "MIXED",
      WS: "MAIN",
      LRF: "MAIN",
      XHF: "MAIN",
      XCW: "NO_MAIN",
      CF: "NO_MAIN",
      WSJ: "NO_MAIN",
      GDYT: "NO_MAIN",
      YT: "NO_MAIN",
      YMJ: "NO_MAIN",
      WSWSJ: "NO_MAIN",
      CS: "MAIN"
    },
    maxDevicesPerRule: 12,
    defaultCeilingHeight: 2800
  };

  // shared/placement-rules.mjs
  var DEVICE_KEY_ALIASES = Object.freeze({
    "\u78C1\u5438\u8F68\u9053": "\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u78C1\u5438\u8F68\u9053",
    "\u78C1\u5438\u6CDB\u5149\u706F\u4F53": "\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u706F\u4F53",
    "\u78C1\u5438\u683C\u6805\u706F\u4F53": "\u78C1\u5438\u683C\u6805\u706F \xB7 \u706F\u4F53"
  });
  var MOUNT_LABELS = Object.freeze({
    CL: "\u9876\u9762",
    WL: "\u5899\u9762",
    SL: "\u7ACB\u9762",
    BL: "\u4F4E\u4F4D"
  });
  function normalizeDeviceName(name) {
    const s = String(name ?? "").replaceAll("\xB7", " \xB7 ").replace(/\s+/g, " ").trim();
    return DEVICE_KEY_ALIASES[s] || s;
  }
  function ruleDeviceNames(rule) {
    const name = normalizeDeviceName(rule?.deviceCanonical ?? rule?.deviceType2 ?? "");
    const names = [];
    const add = (value) => {
      if (value && !names.includes(value)) names.push(value);
    };
    add(name);
    for (const part of name.split(/[\/;]/).map((s) => s.trim()).filter(Boolean)) add(part);
    if (name.includes("\u7A97\u5E18\u7535\u673A")) add("\u7A97\u5E18\u7535\u673A");
    if (name.includes("\u5377\u5E18")) add("\u5377\u5E18\u7535\u673A");
    if (name.includes("\u5438\u9876\u706F")) add("\u5438\u9876\u706F");
    if (name.includes("\u9762\u677F\u706F")) add("\u9762\u677F\u706F");
    if (name.includes("\u7B52\u706F")) add("\u7B52\u706F");
    if (name.includes("\u706F\u69FD\u706F\u5E26")) add("\u706F\u69FD\u706F\u5E26");
    if (name.includes("\u76F4\u7EBF\u706F\u5E26")) add("\u76F4\u7EBF\u706F\u5E26");
    return names;
  }
  function ruleMatchesDeviceKey(rule, deviceKey) {
    const key = normalizeDeviceName(deviceKey);
    if (!key) return false;
    const names = ruleDeviceNames(rule);
    if (names.includes(key)) return true;
    const name = names[0] || "";
    if (!name) return false;
    if (key.includes("\u8F68\u9053") && !name.includes("\u8F68\u9053")) {
      if (key.includes("\u7A97\u5E18") && name.includes("\u7A97\u5E18")) return true;
      return false;
    }
    if (key.includes("\u706F\u5E26") && !name.includes("\u706F\u5E26")) return false;
    return name.includes(key) || key.includes(name);
  }

  // src/core/geometry.ts
  var EPS = 1e-6;
  function polygonArea(poly) {
    let a = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      a += x1 * y2 - x2 * y1;
    }
    return Math.abs(a) / 2;
  }
  function polygonCentroid(poly) {
    let cx = 0, cy = 0, a = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      const cross = x1 * y2 - x2 * y1;
      a += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    }
    if (Math.abs(a) < EPS) {
      const n = poly.length || 1;
      return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
    }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function bboxOf(poly) {
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  function pointInPolygon(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      const intersect = yi > p[1] !== yj > p[1] && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi + EPS) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function distance(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }
  function lerp(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  function pointToSegmentDistance(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    if (l2 < EPS) return distance(p, a);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    return distance(p, [a[0] + t * dx, a[1] + t * dy]);
  }
  function rectCenter(rect) {
    return [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2];
  }
  function polygonEdges(poly) {
    return poly.map((a, i) => {
      const b = poly[(i + 1) % poly.length];
      return { a, b, length: distance(a, b) };
    });
  }
  function inwardNormal(edge, centroid) {
    const dx = edge.b[0] - edge.a[0], dy = edge.b[1] - edge.a[1];
    const len = Math.hypot(dx, dy) || 1;
    let n = [-dy / len, dx / len];
    const mid = [(edge.a[0] + edge.b[0]) / 2, (edge.a[1] + edge.b[1]) / 2];
    const toCenter = [centroid[0] - mid[0], centroid[1] - mid[1]];
    if (n[0] * toCenter[0] + n[1] * toCenter[1] < 0) n = [-n[0], -n[1]];
    return n;
  }
  function sideOfLine(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  }
  function openingCenter(opening, wall) {
    const dx = wall.b[0] - wall.a[0], dy = wall.b[1] - wall.a[1];
    const len = Math.hypot(dx, dy) || 1;
    const u = [dx / len, dy / len];
    const t = opening.start + opening.width / 2;
    return [wall.a[0] + u[0] * t, wall.a[1] + u[1] * t];
  }
  function openingEnds(opening, wall) {
    const dx = wall.b[0] - wall.a[0], dy = wall.b[1] - wall.a[1];
    const len = Math.hypot(dx, dy) || 1;
    const u = [dx / len, dy / len];
    const n = [-u[1], u[0]];
    const p0 = [wall.a[0] + u[0] * opening.start, wall.a[1] + u[1] * opening.start];
    const p1 = [p0[0] + u[0] * opening.width, p0[1] + u[1] * opening.width];
    return { p0, p1, u, n };
  }
  function openingNearRoom(opening, wall, room, tol = 650) {
    const c = openingCenter(opening, wall);
    if (pointInPolygon(c, room.polygon)) return true;
    return polygonEdges(room.polygon).some((e) => pointToSegmentDistance(c, e.a, e.b) <= tol);
  }
  function doorSwingPolygon(opening, wall, room) {
    if (opening.type !== "door") return [];
    const { p0, p1, u, n } = openingEnds(opening, wall);
    const hinge = opening.hinge === "end" ? p1 : p0;
    const other = opening.hinge === "end" ? p0 : p1;
    const centroid = polygonCentroid(room.polygon);
    const towardRoom = sideOfLine(centroid, wall.a, wall.b) >= 0 ? 1 : -1;
    const normal = [n[0] * towardRoom, n[1] * towardRoom];
    const r = opening.width + 50;
    const a0 = Math.atan2(other[1] - hinge[1], other[0] - hinge[0]);
    const a1 = Math.atan2(normal[1], normal[0]);
    let delta = a1 - a0;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    const pts = [hinge];
    for (let i = 0; i <= 10; i++) {
      const ang = a0 + delta * i / 10;
      pts.push([hinge[0] + Math.cos(ang) * r, hinge[1] + Math.sin(ang) * r]);
    }
    return pts;
  }
  function inscribedRect(poly, clearance = 100) {
    const b = bboxOf(poly);
    const xs = /* @__PURE__ */ new Set([b.x + clearance, b.x + b.w - clearance]);
    const ys = /* @__PURE__ */ new Set([b.y + clearance, b.y + b.h - clearance]);
    for (const p of poly) {
      if (p[0] > b.x + clearance && p[0] < b.x + b.w - clearance) xs.add(p[0]);
      if (p[1] > b.y + clearance && p[1] < b.y + b.h - clearance) ys.add(p[1]);
    }
    for (let x = b.x + clearance; x <= b.x + b.w - clearance; x += 500) xs.add(x);
    for (let y = b.y + clearance; y <= b.y + b.h - clearance; y += 500) ys.add(y);
    const xa = [...xs].sort((a, b2) => a - b2);
    const ya = [...ys].sort((a, b2) => a - b2);
    let best = { x: b.x + clearance, y: b.y + clearance, w: Math.max(0, b.w - clearance * 2), h: Math.max(0, b.h - clearance * 2) };
    let bestArea = best.w * best.h;
    for (let i = 0; i < xa.length; i++) {
      for (let j = i + 1; j < xa.length; j++) {
        for (let k = 0; k < ya.length; k++) {
          for (let l = k + 1; l < ya.length; l++) {
            const x = xa[i], y = ya[k], w = xa[j] - xa[i], h = ya[l] - ya[k];
            if (w < 400 || h < 400) continue;
            const area = w * h;
            if (area <= bestArea) continue;
            const probes = [
              [x, y],
              [x + w, y],
              [x + w, y + h],
              [x, y + h],
              [x + w / 2, y + h / 2],
              [x + w / 2, y],
              [x + w / 2, y + h],
              [x, y + h / 2],
              [x + w, y + h / 2]
            ];
            if (probes.every((p) => pointInPolygon(p, poly))) {
              best = { x, y, w, h };
              bestArea = area;
            }
          }
        }
      }
    }
    return best;
  }
  function furnitureInRoom(project, roomId, types) {
    return project.furniture.filter((f) => f.roomId === roomId && (!types?.length || types.includes(f.type)));
  }
  function furniturePoints(f, mode, roomCentroid, count = 2) {
    const [x, y, w, h] = f.rect;
    const c = [x + w / 2, y + h / 2];
    if (mode === "center") return [c];
    if (mode === "pair") {
      return [[x + w * 0.25, y + h / 2], [x + w * 0.75, y + h / 2]];
    }
    const horizontal = w >= h;
    const dx = roomCentroid[0] - c[0], dy = roomCentroid[1] - c[1];
    const len = Math.hypot(dx, dy) || 1;
    const ox = dx / len * (horizontal ? h / 2 + 180 : w / 2 + 180);
    const oy = dy / len * (horizontal ? h / 2 + 180 : w / 2 + 180);
    const n = Math.max(1, Math.round(count));
    if (horizontal) {
      return Array.from({ length: n }, (_, i) => [x + w * ((i + 0.5) / n), c[1] + oy]);
    }
    return Array.from({ length: n }, (_, i) => [c[0] + ox, y + h * ((i + 0.5) / n)]);
  }
  function furnitureEdgeCenter(f, roomCentroid, offset = 80) {
    const [x, y, w, h] = f.rect;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const horizontal = w >= h;
    const dx = roomCentroid[0] - cx;
    const dy = roomCentroid[1] - cy;
    const len = Math.hypot(dx, dy) || 1;
    const off = (horizontal ? h : w) / 2 + offset;
    return {
      p: [cx + dx / len * off, cy + dy / len * off],
      angle: f.rotation,
      length: horizontal ? w : h
    };
  }
  function wallOffsetPoints(room, offset) {
    const c = polygonCentroid(room.polygon);
    const out = [];
    for (const e of polygonEdges(room.polygon)) {
      const n = inwardNormal(e, c);
      const a = [e.a[0] + n[0] * offset, e.a[1] + n[1] * offset];
      const b = [e.b[0] + n[0] * offset, e.b[1] + n[1] * offset];
      const angle = Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]) * 180 / Math.PI;
      out.push({ p: lerp(a, b, 0.33), angle }, { p: lerp(a, b, 0.67), angle });
    }
    return out;
  }
  function perimeterPoints(room, offset) {
    return wallOffsetPoints(room, offset);
  }
  function perimeterSegments(room, offset) {
    const c = polygonCentroid(room.polygon);
    return polygonEdges(room.polygon).map((e) => {
      const n = inwardNormal(e, c);
      const mid = [(e.a[0] + e.b[0]) / 2 + n[0] * offset, (e.a[1] + e.b[1]) / 2 + n[1] * offset];
      return {
        p: mid,
        angle: Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]) * 180 / Math.PI,
        length: Math.max(300, e.length - offset * 2)
      };
    });
  }
  function moveInsideRoom(room, p) {
    if (pointInPolygon(p, room.polygon)) return p;
    const c = polygonCentroid(room.polygon);
    const dx = c[0] - p[0];
    const dy = c[1] - p[1];
    const dist = Math.hypot(dx, dy) || 1;
    const limit = Math.min(dist, 2400);
    for (let t = 20; t <= limit; t += 20) {
      const q = [p[0] + dx / dist * t, p[1] + dy / dist * t];
      if (pointInPolygon(q, room.polygon)) return q;
    }
    return c;
  }
  function rayInsideDistance(room, p, dir, maxDist) {
    let lo = 0;
    let hi = Math.max(0, maxDist);
    for (let i = 0; i < 26; i++) {
      const mid = (lo + hi) / 2;
      const q = [p[0] + dir[0] * mid, p[1] + dir[1] * mid];
      if (pointInPolygon(q, room.polygon)) lo = mid;
      else hi = mid;
    }
    return lo;
  }
  function fitSegmentInRoom(room, center, angleDeg, length) {
    const p0 = moveInsideRoom(room, center);
    const a = angleDeg * Math.PI / 180;
    const dir = [Math.cos(a), Math.sin(a)];
    const b = bboxOf(room.polygon);
    const maxDist = Math.hypot(b.w, b.h);
    const minus = rayInsideDistance(room, p0, [-dir[0], -dir[1]], maxDist);
    const plus = rayInsideDistance(room, p0, dir, maxDist);
    const span = minus + plus;
    const len = Math.max(0, Math.min(length, span));
    if (len <= 0) return { center: p0, length: 0 };
    const lower = len / 2 - minus;
    const upper = plus - len / 2;
    const shift = Math.min(Math.max(0, lower), upper);
    return {
      center: [p0[0] + dir[0] * shift, p0[1] + dir[1] * shift],
      length: len
    };
  }
  function fitBoxInRoom(room, center, angleDeg, width, depth) {
    const x = fitSegmentInRoom(room, center, angleDeg, width);
    const y = fitSegmentInRoom(room, x.center, angleDeg + 90, depth);
    return { center: y.center, width: x.length, depth: y.length };
  }
  function fitDeviceGeometry(room, center, angleDeg, width, depth, visual) {
    if (visual === "line" || visual === "track") {
      const fit = fitSegmentInRoom(room, center, angleDeg, width);
      return {
        center: fit.center,
        width: Math.max(60, fit.length),
        depth,
        clipped: fit.length < width - 1
      };
    }
    if (visual === "l" || visual === "u" || visual === "rect") {
      const fit = fitBoxInRoom(room, center, angleDeg, width, depth);
      return {
        center: fit.center,
        width: Math.max(60, fit.width),
        depth: Math.max(60, fit.depth),
        clipped: fit.width < width - 1 || fit.depth < depth - 1
      };
    }
    return { center, width, depth, clipped: false };
  }
  function dynamicBoxSize(room) {
    const usable = inscribedRect(room.polygon, 300);
    const areaM2 = polygonArea(room.polygon) / 1e6;
    if (usable.w <= 0 || usable.h <= 0) return { width: 1200, depth: 900 };
    const usableW = usable.w / 1e3;
    const usableH = usable.h / 1e3;
    const targetArea = Math.max(1.2, Math.min(areaM2 * 0.35, usableW * usableH * 0.6, 12));
    const aspect = Math.max(0.5, Math.min(2.2, usableW / usableH));
    let width = Math.sqrt(targetArea * aspect);
    let depth = targetArea / width;
    width = Math.min(width, usableW * 0.88);
    depth = Math.min(depth, usableH * 0.88);
    return {
      width: Math.round(Math.max(800, width * 1e3)),
      depth: Math.round(Math.max(600, depth * 1e3))
    };
  }
  function longAxisPoints(room, count) {
    const b = bboxOf(room.polygon);
    const c = polygonCentroid(room.polygon);
    const horizontal = b.w >= b.h;
    const length = horizontal ? b.w : b.h;
    const n = Math.max(1, count);
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : (i + 1) / (n + 1);
      const p = horizontal ? [b.x + length * t, c[1]] : [c[0], b.y + length * t];
      out.push({ p, angle: horizontal ? 0 : 90 });
    }
    return out;
  }
  function gridPoints(room, rows, rowGap, colGap, clearance) {
    const r = inscribedRect(room.polygon, clearance);
    if (r.w <= 0 || r.h <= 0) return [];
    const horizontal = r.w >= r.h;
    const out = [];
    if (horizontal) {
      const yTop = r.y + r.h / 2 + rowGap / 2;
      const yBottom = r.y + r.h / 2 - rowGap / 2;
      const n = Math.max(1, Math.round(r.w / Math.max(colGap, 1)));
      for (let i = 0; i < Math.max(rows, 1); i++) {
        const y = i === 0 ? yBottom : yTop;
        for (let j = 0; j < n; j++) {
          const t = n === 1 ? 0.5 : (j + 0.5) / n;
          out.push({ p: [r.x + r.w * t, y], angle: 0 });
        }
      }
    } else {
      const xLeft = r.x + r.w / 2 - rowGap / 2;
      const xRight = r.x + r.w / 2 + rowGap / 2;
      const n = Math.max(1, Math.round(r.h / Math.max(colGap, 1)));
      for (let i = 0; i < Math.max(rows, 1); i++) {
        const x = i === 0 ? xLeft : xRight;
        for (let j = 0; j < n; j++) {
          const t = n === 1 ? 0.5 : (j + 0.5) / n;
          out.push({ p: [x, r.y + r.h * t], angle: 90 });
        }
      }
    }
    return out;
  }
  function pathPoints(room, project, count = 4) {
    const bed = furnitureInRoom(project, room.id, ["bed"])[0];
    const target = bed ? rectCenter(bed.rect) : polygonCentroid(room.polygon);
    const doors = project.openings.filter((o) => o.type === "door").map((o) => {
      const w = project.walls.find((w2) => w2.id === o.wallId);
      return w ? { o, w } : null;
    }).filter(Boolean);
    let doorP = null;
    let best = Infinity;
    for (const { o, w } of doors) {
      const c = openingCenter(o, w);
      const d = pointToSegmentDistance(c, room.polygon[0], room.polygon[1]);
      if (pointInPolygon(c, room.polygon) || d < 800) {
        if (d < best) {
          best = d;
          doorP = c;
        }
      }
    }
    const start = doorP ?? polygonCentroid(room.polygon);
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count;
      return { p: lerp(start, target, t), angle: 0 };
    });
  }

  // src/core/engine.ts
  var RULES = rules_generated_default;
  function catalogDevicesForRule(rule) {
    const found = /* @__PURE__ */ new Map();
    const add = (d) => {
      if (d) found.set(d.key, d);
    };
    for (const name of ruleDeviceNames(rule)) {
      add(DEVICE_BY_KEY[name]);
      add(findDevice(name));
    }
    return [...found.values()];
  }
  function deviceForRule(rule) {
    return catalogDevicesForRule(rule)[0];
  }
  function rulesForRoom(spaceCode) {
    return RULES.filter((r) => r.spaceCode === spaceCode);
  }
  function openingsNearRoom(project, room, type) {
    return project.openings.filter((o) => !type || o.type === type).map((o) => {
      const w = project.walls.find((w2) => w2.id === o.wallId);
      return w ? { o, w } : null;
    }).filter((x) => !!x && openingNearRoom(x.o, x.w, room));
  }
  function doorSideCandidates(room, project, offset) {
    const c = polygonCentroid(room.polygon);
    const doors = openingsNearRoom(project, room, "door");
    const out = [];
    for (const { o, w } of doors) {
      const { p0, p1, u, n } = openingEnds(o, w);
      const side = sideOfLine(c, w.a, w.b) >= 0 ? 1 : -1;
      const inward = [n[0] * side, n[1] * side];
      const angle = Math.atan2(u[1], u[0]) * 180 / Math.PI;
      const candidates = [
        [p0[0] - u[0] * offset + inward[0] * 80, p0[1] - u[1] * offset + inward[1] * 80],
        [p1[0] + u[0] * offset + inward[0] * 80, p1[1] + u[1] * offset + inward[1] * 80]
      ];
      for (const p of candidates) if (pointInPolygon(p, room.polygon)) out.push({ p, angle });
    }
    return out.length ? out : wallOffsetPoints(room, 150);
  }
  function windowCandidates(project, room) {
    const c = polygonCentroid(room.polygon);
    const wins = openingsNearRoom(project, room, "window");
    const out = [];
    for (const { o, w } of wins) {
      const center = openingCenter(o, w);
      const { u, n } = openingEnds(o, w);
      const side = sideOfLine(c, w.a, w.b) >= 0 ? 1 : -1;
      const inward = [n[0] * side, n[1] * side];
      const p = [center[0] + inward[0] * 160, center[1] + inward[1] * 160];
      out.push({
        p,
        angle: Math.atan2(u[1], u[0]) * 180 / Math.PI,
        length: o.width
      });
    }
    return out.length ? out : wallOffsetPoints(room, 160);
  }
  function chooseFurniture(project, room, anchor) {
    const types = anchor.furnitureTypes ?? [];
    if (types.length) {
      const found = furnitureInRoom(project, room.id, types);
      if (found.length) return found;
    }
    if (anchor.target === "tv") {
      return furnitureInRoom(project, room.id, ["tv", "tvCabinet"]);
    }
    if (anchor.target === "tvCabinet") {
      return furnitureInRoom(project, room.id, ["tvCabinet", "tv"]);
    }
    return [];
  }
  function nearestRoomEdge(room, p) {
    let best = null;
    for (const e of polygonEdges(room.polygon)) {
      const d = pointToSegmentDistance(p, e.a, e.b);
      if (!best || d < best.d) best = { a: e.a, b: e.b, d };
    }
    return best;
  }
  function hostTrackLine(host, roomCentroid) {
    const [x, y, w, h] = host.rect;
    const cx = x + w / 2, cy = y + h / 2;
    const horizontal = w >= h;
    const dx = roomCentroid[0] - cx, dy = roomCentroid[1] - cy;
    const len = Math.hypot(dx, dy) || 1;
    const off = (horizontal ? h : w) / 2 + 300;
    if (horizontal) {
      const ly = cy + dy / len * off;
      return { a: [x, ly], b: [x + w, ly], len: w, angle: 0 };
    }
    const lx = cx + dx / len * off;
    return { a: [lx, y], b: [lx, y + h], len: h, angle: 90 };
  }
  function candidatesFor(rule, room, project) {
    const anchor = rule.anchor;
    const c = polygonCentroid(room.polygon);
    if (rule.deviceType2.includes("\u8D34\u5899\u706F\u5E26") && anchor.kind === "roomCenter" && rule.quantity.measure === "wall") {
      const bed = furnitureInRoom(project, room.id, ["bed"])[0];
      if (bed) {
        const bc = rectCenter(bed.rect);
        const windows = openingsNearRoom(project, room, "window");
        const edges = polygonEdges(room.polygon).map((e) => ({ e, d: pointToSegmentDistance(bc, e.a, e.b) })).sort((a, b) => a.d - b.d);
        for (const { e: edge } of edges) {
          const ux = edge.b[0] - edge.a[0];
          const uy = edge.b[1] - edge.a[1];
          const len = Math.hypot(ux, uy) || 1;
          const t = Math.max(0, Math.min(len, ((bc[0] - edge.a[0]) * ux + (bc[1] - edge.a[1]) * uy) / len));
          const p = [edge.a[0] + ux / len * t, edge.a[1] + uy / len * t];
          const nearWindow = windows.some(({ o, w }) => {
            const { p0, p1 } = openingEnds(o, w);
            return pointToSegmentDistance(p, p0, p1) < 300;
          });
          if (nearWindow) continue;
          return {
            list: [{
              p,
              angle: Math.atan2(uy, ux) * 180 / Math.PI,
              length: Math.min(Math.max(bed.rect[2], bed.rect[3]), len)
            }]
          };
        }
      }
    }
    if (rule.deviceType2.includes("\u706F\u69FD\u706F\u5E26") && anchor.kind === "roomCenter") {
      return { list: perimeterSegments(room, 120) };
    }
    if (anchor.kind === "furnitureEdge" && rule.deviceType2 === "\u5C04\u706F") {
      const f = chooseFurniture(project, room, anchor)[0];
      if (f) {
        const edge = nearestRoomEdge(room, rectCenter(f.rect));
        if (edge) {
          const len = distance(edge.a, edge.b) || 1;
          const ux = (edge.b[0] - edge.a[0]) / len;
          const uy = (edge.b[1] - edge.a[1]) / len;
          let nx = -uy, ny = ux;
          const mx = (edge.a[0] + edge.b[0]) / 2;
          const my = (edge.a[1] + edge.b[1]) / 2;
          if ((c[0] - mx) * nx + (c[1] - my) * ny < 0) {
            nx = -nx;
            ny = -ny;
          }
          const n = Math.max(2, Math.min(8, quantityFor2(rule, room, project).count));
          const offset = 300;
          const list = Array.from({ length: n }, (_, i) => {
            const t = (i + 0.5) / n;
            return {
              p: [edge.a[0] + ux * len * t + nx * offset, edge.a[1] + uy * len * t + ny * offset],
              angle: Math.atan2(uy, ux) * 180 / Math.PI
            };
          });
          return { list };
        }
      }
    }
    if (rule.deviceType2 === "\u7B52\u706F" && anchor.kind === "furnitureEdge" && anchor.target === "tv") {
      const tv = furnitureInRoom(project, room.id, ["tv", "tvCabinet"])[0];
      const sofa = furnitureInRoom(project, room.id, ["sofa"])[0];
      if (tv && sofa) {
        const [tx, ty, tw, th] = tv.rect;
        const [sx, sy, sw, sh] = sofa.rect;
        const horizontal = Math.abs(sx + sw / 2 - (tx + tw / 2)) >= Math.abs(sy + sh / 2 - (ty + th / 2));
        const q = Math.max(1, quantityFor2(rule, room, project).count);
        const list = [];
        if (horizontal) {
          const tvFront = tx + tw < sx ? tx + tw : tx;
          const sofaFront = tx + tw < sx ? sx : sx + sw;
          const midX = (tvFront + sofaFront) / 2;
          const y0 = Math.max(ty, sy), y1 = Math.min(ty + th, sy + sh);
          const span = y1 > y0 ? y1 - y0 : Math.min(th, sh);
          const base = y1 > y0 ? y0 : ty + th / 2 - span / 2;
          for (let i = 0; i < q; i++) list.push({ p: [midX, base + span * ((i + 0.5) / q)], angle: 0 });
        } else {
          const tvFront = ty + th < sy ? ty + th : ty;
          const sofaFront = ty + th < sy ? sy : sy + sh;
          const midY = (tvFront + sofaFront) / 2;
          const x0 = Math.max(tx, sx), x1 = Math.min(tx + tw, sx + sw);
          const span = x1 > x0 ? x1 - x0 : Math.min(tw, sw);
          const base = x1 > x0 ? x0 : tx + tw / 2 - span / 2;
          for (let i = 0; i < q; i++) list.push({ p: [base + span * ((i + 0.5) / q), midY], angle: 90 });
        }
        return { list };
      }
    }
    if (rule.deviceType2.includes("\u78C1\u5438")) {
      const host = furnitureInRoom(project, room.id, ["tv", "tvCabinet"])[0] ?? furnitureInRoom(project, room.id, ["sofa"])[0];
      if (host) {
        const line = hostTrackLine(host, c);
        if (rule.deviceType2.includes("\u78C1\u5438\u8F68\u9053")) {
          return {
            list: [{
              p: [(line.a[0] + line.b[0]) / 2, (line.a[1] + line.b[1]) / 2],
              angle: line.angle,
              length: line.len
            }]
          };
        }
        const n = Math.max(1, Math.min(12, quantityFor2(rule, room, project).count));
        const isTrack = rule.deviceType2.includes("\u8F68\u9053");
        const isGrid = rule.deviceType2.includes("\u683C\u6805");
        const list = [];
        for (let i = 0; i < n; i++) {
          const t = isTrack ? (i + 0.5) / n : isGrid ? (i + 1) / (n + 1) : (i + 0.5) / n;
          const p = [line.a[0] + (line.b[0] - line.a[0]) * t, line.a[1] + (line.b[1] - line.a[1]) * t];
          list.push({ p, angle: line.angle, ...isTrack ? { length: line.len / n } : {} });
        }
        return { list };
      }
    }
    if ((anchor.kind === "roomCenter" || anchor.kind === "longAxisLine") && String(anchor.raw || "").includes("\u6C99\u53D1")) {
      const sofa = furnitureInRoom(project, room.id, ["sofa"])[0];
      if (sofa) {
        const [x, y, w, h] = sofa.rect;
        const cx = x + w / 2, cy = y + h / 2;
        const horizontal = w >= h;
        const b = bboxOf(room.polygon);
        const clamp = (p) => [
          Math.max(b.x + 150, Math.min(b.x + b.w - 150, p[0])),
          Math.max(b.y + 150, Math.min(b.y + b.h - 150, p[1]))
        ];
        if (rule.deviceType2 === "\u5C04\u706F") {
          const pts = horizontal ? [[x - 400, cy], [x + w + 400, cy]] : [[cx, y - 400], [cx, y + h + 400]];
          return { list: pts.map((p) => ({ p: clamp(p), angle: sofa.rotation })) };
        }
        if (rule.deviceType2 === "\u843D\u5730\u706F") {
          const dx = c[0] - cx, dy = c[1] - cy;
          const ends = horizontal ? [
            [x - 300, (dy >= 0 ? y + h : y) + (dy >= 0 ? 250 : -250)],
            [x + w + 300, (dy >= 0 ? y + h : y) + (dy >= 0 ? 250 : -250)]
          ] : [
            [(dx >= 0 ? x + w : x) + (dx >= 0 ? 250 : -250), y - 300],
            [(dx >= 0 ? x + w : x) + (dx >= 0 ? 250 : -250), y + h + 300]
          ];
          const score = (p) => Math.min(p[0] - b.x, b.x + b.w - p[0], p[1] - b.y, b.y + b.h - p[1]);
          const best = ends.sort((a, b2) => score(b2) - score(a))[0];
          return { list: [{ p: clamp(best), angle: sofa.rotation }] };
        }
        if (rule.deviceType2 === "\u5438\u9876\u5587\u53ED") {
          const dx = c[0] - cx, dy = c[1] - cy;
          const len = Math.hypot(dx, dy) || 1;
          const off = (horizontal ? h : w) / 2 + 600;
          const q = Math.max(1, quantityFor2(rule, room, project).count);
          const along = horizontal ? w : h;
          const list = Array.from({ length: q }, (_, i) => {
            const t = q === 1 ? 0 : (i / (q - 1) - 0.5) * 0.6 * along;
            const p = horizontal ? [cx + t, cy + dy / len * off] : [cx + dx / len * off, cy + t];
            return { p: clamp(p), angle: sofa.rotation };
          });
          return { list };
        }
      }
    }
    if (anchor.kind === "roomCenter" && rule.deviceType2.includes("\u5149\u7167\u4F20\u611F\u5668")) {
      const wins = openingsNearRoom(project, room, "window");
      if (wins.length) {
        const { o, w } = wins[0];
        const ct = openingCenter(o, w);
        const { u, n } = openingEnds(o, w);
        const side = sideOfLine(c, w.a, w.b) >= 0 ? 1 : -1;
        const lateral = Math.min(600, (o.width || 1800) * 0.3);
        return {
          list: [{
            p: [
              ct[0] - u[0] * lateral + n[0] * side * 650,
              ct[1] - u[1] * lateral + n[1] * side * 650
            ],
            angle: 0
          }]
        };
      }
    }
    if (rule.deviceType2 === "\u60C5\u666F\u9762\u677F" && anchor.kind === "roomCenter" && String(anchor.raw || "").includes("\u5F00\u5173\u9762\u677F")) {
      const pts = doorSideCandidates(room, project, 175);
      if (pts.length) {
        const base = pts[0];
        const ux = Math.cos(base.angle * Math.PI / 180);
        const uy = Math.sin(base.angle * Math.PI / 180);
        return { list: [{ p: [base.p[0] + ux * 100, base.p[1] + uy * 100], angle: base.angle }] };
      }
    }
    if ((rule.deviceType2 === "\u5C04\u706F" || rule.deviceType2 === "\u53F0\u706F") && /书桌|学习桌/.test(String(anchor.raw || ""))) {
      const desk = furnitureInRoom(project, room.id, ["desk"])[0];
      if (desk) {
        const [x, y, w, h] = desk.rect;
        if (rule.deviceType2 === "\u53F0\u706F") {
          return { list: [{ p: [x + w * 0.18, y + h * 0.5], angle: desk.rotation }] };
        }
        return {
          list: furniturePoints(desk, "edge", c, 2).map((p) => ({ p, angle: desk.rotation, length: Math.max(desk.rect[2], desk.rect[3]) }))
        };
      }
    }
    if (rule.deviceType2 === "\u4E2D\u63A7\u5C4F" && String(anchor.raw || "").includes("\u5165\u53E3")) {
      const doors = openingsNearRoom(project, room, "door");
      const pts = doorSideCandidates(room, project, 175);
      if (pts.length && doors.length) {
        const doorCenter = openingCenter(doors[0].o, doors[0].w);
        const base = pts[0];
        const ux = Math.cos(base.angle * Math.PI / 180);
        const uy = Math.sin(base.angle * Math.PI / 180);
        const sign = (base.p[0] - doorCenter[0]) * ux + (base.p[1] - doorCenter[1]) * uy >= 0 ? 1 : -1;
        return { list: [{ p: [base.p[0] + ux * sign * 400, base.p[1] + uy * sign * 400], angle: base.angle }] };
      }
    }
    switch (anchor.kind) {
      case "roomCenter": {
        const b = bboxOf(room.polygon);
        const n = Math.max(1, Math.min(8, quantityFor2(rule, room, project).count));
        const horizontal = b.w >= b.h;
        const list = [];
        for (let i = 0; i < n; i++) {
          const t = n === 1 ? 0.5 : (i + 0.5) / n;
          list.push(horizontal ? { p: [b.x + b.w * t, c[1]], angle: 0 } : { p: [c[0], b.y + b.h * t], angle: 90 });
        }
        return { list };
      }
      case "inscribedRectCenter": {
        const r = inscribedRect(room.polygon, 200);
        return { list: [{ p: [r.x + r.w / 2, r.y + r.h / 2], angle: 0 }] };
      }
      case "inscribedGrid": {
        const d = DEMO_DEFAULTS.downlight;
        return {
          list: gridPoints(room.polygon ? room : room, anchor.rows ?? d.rows, anchor.rowGap ?? d.rowGap, anchor.colGap ?? d.colGap, d.wallClearance)
        };
      }
      case "longAxisLine":
        return { list: longAxisPoints(room, 10) };
      case "wallOffset":
        return { list: wallOffsetPoints(room, anchor.offset ?? 300) };
      case "wallEvenDivide":
        return { list: wallOffsetPoints(room, anchor.offset ?? 250) };
      case "doorSideWall":
        return { list: doorSideCandidates(room, project, anchor.offset ?? 175) };
      case "windowHead":
        return { list: windowCandidates(project, room) };
      case "furnitureCenter": {
        const fs = chooseFurniture(project, room, anchor);
        if (!fs.length) return { list: [], note: "NO_FURNITURE" };
        if (rule.deviceType2.includes("\u706F\u5E26")) {
          return {
            list: fs.map((f) => {
              const e = furnitureEdgeCenter(f, c, 50);
              return { p: e.p, angle: e.angle, length: e.length };
            })
          };
        }
        return { list: fs.flatMap((f) => furniturePoints(f, "center", c).map((p) => ({ p, angle: f.rotation }))) };
      }
      case "furniturePair": {
        const ns = furnitureInRoom(project, room.id, ["nightstand"]);
        if (ns.length >= 2) {
          return { list: ns.slice(0, 2).map((f) => ({ p: rectCenter(f.rect), angle: f.rotation })) };
        }
        const bed = furnitureInRoom(project, room.id, ["bed"])[0];
        if (bed) {
          const [x, y, w, h] = bed.rect;
          return {
            list: [
              { p: [x - 350, y + h * 0.5], angle: 0 },
              { p: [x + w + 350, y + h * 0.5], angle: 0 }
            ],
            note: "BED_SIDE_FALLBACK"
          };
        }
        return { list: wallOffsetPoints(room, 250), note: "NO_FURNITURE" };
      }
      case "furnitureEdge": {
        const fs = chooseFurniture(project, room, anchor);
        if (!fs.length) return { list: [], note: "NO_FURNITURE" };
        if (rule.deviceType2.includes("\u706F\u5E26")) {
          return {
            list: fs.map((f) => {
              const e = furnitureEdgeCenter(f, c);
              return { p: e.p, angle: e.angle, length: e.length };
            })
          };
        }
        const n = Math.max(2, Math.min(12, quantityFor2(rule, room, project).count));
        return { list: fs.flatMap((f) => furniturePoints(f, "edge", c, n).map((p) => ({ p, angle: f.rotation, length: Math.max(f.rect[2], f.rect[3]) }))) };
      }
      case "pathLine":
        return { list: pathPoints(room, project, 6) };
      case "hostTrack":
        return { list: longAxisPoints(room, 8), note: "HOST_TRACK_FALLBACK" };
      case "cabinetShelf": {
        const fs = furnitureInRoom(project, room.id, ["wardrobe", "upperCabinet", "bookshelf", "displayCabinet"]);
        if (!fs.length) return { list: [], note: "NO_FURNITURE" };
        if (rule.deviceType2.includes("\u706F\u5E26")) {
          return {
            list: fs.map((f) => {
              const e = furnitureEdgeCenter(f, c, 50);
              return { p: e.p, angle: e.angle, length: e.length };
            })
          };
        }
        return { list: fs.flatMap((f) => furniturePoints(f, "edge", c).map((p) => ({ p, angle: f.rotation, length: Math.max(f.rect[2], f.rect[3]) }))) };
      }
      case "perimeter":
        return { list: perimeterSegments(room, anchor.offset ?? 100) };
      default:
        return { list: [{ p: c, angle: 0 }] };
    }
  }
  function targetLengthM(rule, room, project) {
    const q = rule.quantity;
    if ((q.kind === "perLength" || q.measure === "track") && rule.deviceType2.includes("\u78C1\u5438")) {
      const host = furnitureInRoom(project, room.id, ["tv", "tvCabinet"])[0] ?? furnitureInRoom(project, room.id, ["sofa"])[0];
      if (host) return Math.max(host.rect[2], host.rect[3]) / 1e3;
    }
    if (q.kind === "perLength" && rule.anchor.kind === "furnitureEdge" && rule.deviceType2 === "\u5C04\u706F") {
      const types = rule.anchor.furnitureTypes ?? [];
      const f = types.length ? furnitureInRoom(project, room.id, types)[0] : void 0;
      if (f) {
        const edge = nearestRoomEdge(room, rectCenter(f.rect));
        if (edge) return distance(edge.a, edge.b) / 1e3;
      }
    }
    if (q.target === "window") {
      const wins = openingsNearRoom(project, room, "window");
      if (wins.length) return wins.reduce((s, x) => s + x.o.width, 0) / 1e3;
    }
    if (q.target?.startsWith("furniture:")) {
      const type = q.target.split(":")[1];
      const fs = furnitureInRoom(project, room.id, [type]);
      if (fs.length) return Math.max(...fs.map((f) => Math.max(f.rect[2], f.rect[3]))) / 1e3;
    }
    const b = bboxOf(room.polygon);
    return Math.max(b.w, b.h) / 1e3;
  }
  function applyRound(n, q) {
    if (q.round === "floor") return Math.floor(n + 1e-6);
    if (q.round === "round") return Math.round(n);
    return Math.ceil(n);
  }
  function quantityFor2(rule, room, project) {
    const q = rule.quantity;
    const excludedArea = (room.excludePolygons ?? []).reduce((s, poly) => s + polygonArea(poly), 0);
    const areaM2 = Math.max(0.5, (polygonArea(room.polygon) - excludedArea) / 1e6);
    const lenM = targetLengthM(rule, room, project);
    let count = 1;
    let stripLengthMm;
    let note;
    switch (q.kind) {
      case "fixed":
        count = q.value ?? 1;
        break;
      case "perArea": {
        const raw = areaM2 / (q.value ?? 2.5);
        count = applyRound(raw, q);
        break;
      }
      case "perLength": {
        const raw = lenM / (q.value ?? 1);
        count = applyRound(raw, q);
        if (rule.deviceType2.includes("\u706F\u5E26")) {
          stripLengthMm = Math.round(Math.max(lenM, 0.8) * 1e3);
          count = 1;
        }
        break;
      }
      case "measuredLength": {
        if (q.measure === "perimeter") count = 4;
        else if (q.measure === "window") count = Math.max(1, openingsNearRoom(project, room, "window").length);
        else if (q.measure === "track") count = Math.max(1, Math.ceil(lenM / 1.2 - 1e-6));
        else if (q.measure === "cabinet") {
          const types = rule.anchor.furnitureTypes?.length ? rule.anchor.furnitureTypes : ["wardrobe", "upperCabinet", "bookshelf", "displayCabinet"];
          count = Math.max(1, furnitureInRoom(project, room.id, types).length);
        } else count = 1;
        break;
      }
      case "perOpening": {
        const opens = openingsNearRoom(project, room, q.target === "door" ? "door" : "window");
        count = Math.max(opens.length, 0) * (q.value ?? 1);
        if (!opens.length) note = "NO_TARGET";
        break;
      }
      case "perFurniture": {
        const fs = furnitureInRoom(project, room.id, q.furnitureTypes);
        count = fs.length * (q.value ?? 1);
        if (!fs.length) {
          if (q.furnitureTypes?.includes("nightstand") && furnitureInRoom(project, room.id, ["bed"]).length) {
            count = 2;
            note = "BED_SIDE_FALLBACK";
          } else {
            count = 0;
            note = "NO_FURNITURE";
          }
        }
        break;
      }
      case "stripPerimeter": {
        const length = Math.max(2, (q.factor ?? 0.8) * 4 * Math.sqrt(Math.max(areaM2, 1)));
        stripLengthMm = Math.round(length * 1e3);
        count = 4;
        break;
      }
      case "cabinetLength": {
        const fs = furnitureInRoom(project, room.id, ["wardrobe", "upperCabinet", "bookshelf", "displayCabinet"]);
        const length = fs.reduce((s, f) => s + Math.max(f.rect[2], f.rect[3]) / 1e3, 0);
        stripLengthMm = Math.round(Math.max(length, 1) * 1e3);
        count = 1;
        if (!fs.length) note = "NO_FURNITURE";
        break;
      }
      case "wholeHouseArea":
        count = 1;
        break;
      default:
        count = q.value ?? 1;
        note = "GENERIC_COUNT";
    }
    if (q.min != null) count = Math.max(count, q.min);
    if (q.max != null) count = Math.min(count, q.max);
    if (q.even) count = Math.floor(count / 2) * 2;
    count = Math.max(0, Math.min(count, DEMO_DEFAULTS.maxDevicesPerRule));
    return { count, stripLengthMm, note };
  }
  function collisionZones(project, room) {
    const zones = [];
    for (const { o, w } of openingsNearRoom(project, room, "door")) {
      const poly = doorSwingPolygon(o, w, room);
      if (poly.length) zones.push({ poly, label: "DOOR_SWING" });
    }
    for (const { o, w } of openingsNearRoom(project, room, "window")) {
      const { p0, p1, n } = openingEnds(o, w);
      const t = 120;
      const poly = [
        [p0[0] - n[0] * t, p0[1] - n[1] * t],
        [p1[0] - n[0] * t, p1[1] - n[1] * t],
        [p1[0] + n[0] * t, p1[1] + n[1] * t],
        [p0[0] + n[0] * t, p0[1] + n[1] * t]
      ];
      zones.push({ poly, label: "WINDOW" });
    }
    const stove = furnitureInRoom(project, room.id, ["stove"])[0];
    if (stove) {
      const [x, y, w, h] = stove.rect;
      zones.push({ poly: [[x - 600, y - 600], [x + w + 600, y - 600], [x + w + 600, y + h + 600], [x - 600, y + h + 600]], label: "STOVE" });
    }
    const tv = furnitureInRoom(project, room.id, ["tv", "tvCabinet"])[0];
    if (tv) {
      const [x, y, w, h] = tv.rect;
      zones.push({ poly: [[x + w * 0.2, y - 300], [x + w * 0.8, y - 300], [x + w * 0.8, y + h + 300], [x + w * 0.2, y + h + 300]], label: "TV_SCREEN" });
    }
    const shower = furnitureInRoom(project, room.id, ["shower", "bathtub"])[0];
    if (shower) {
      const [x, y, w, h] = shower.rect;
      zones.push({ poly: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], label: "WET_ZONE" });
    }
    return zones;
  }
  function blocked(rule, p, room, project, zones) {
    if (!pointInPolygon(p, room.polygon)) {
      const near = polygonEdges(room.polygon).some((e) => pointToSegmentDistance(p, e.a, e.b) < 120);
      if (!near) return "OUT_OF_ROOM";
    }
    if (room.excludePolygons?.some((poly) => pointInPolygon(p, poly))) return "FUNCTION_ZONE_EXCLUDED";
    const mount = rule.mount;
    for (const z of zones) {
      if (mount === "WL") continue;
      if (mount === "CL" && ["DOOR_SWING", "WINDOW", "WET_ZONE", "TV_SCREEN"].includes(z.label)) continue;
      if (mount === "BL" && z.label === "DOOR_SWING") continue;
      if (pointInPolygon(p, z.poly)) return z.label;
    }
    return null;
  }
  function nearestExisting(p, devices, rule) {
    let min = Infinity;
    for (const d of devices) {
      if (d.ruleCode === rule.pointCode) continue;
      if (d.deviceType2 !== rule.deviceType2) continue;
      const dist = distance(p, [d.position.x, d.position.y]);
      if (dist < min) min = dist;
    }
    return { ok: min >= (rule.spacing || 0), min };
  }
  function makeDevice(rule, room, def, c, idx, status, notes, bomQuantity) {
    const b = bboxOf(room.polygon);
    const maxStrip = Math.max(b.w, b.h) * 1.15;
    const dynamic = ["rect", "l", "u"].includes(def.visual) ? dynamicBoxSize(room) : null;
    const rawWidth = dynamic?.width ?? (c.length && def.glow === "line" ? Math.min(c.length, maxStrip) : def.size.width);
    const rawDepth = dynamic?.depth ?? def.size.depth;
    const fitted = fitDeviceGeometry(room, c.p, c.angle, Math.max(rawWidth, 60), rawDepth, def.visual);
    const warnings = [];
    if (dynamic) {
      warnings.push(`\u706F\u7EC4\u5C3A\u5BF8\u6309\u7A7A\u95F4\u53EF\u7528\u9762\u79EF\u52A8\u6001\u8BA1\u7B97\uFF1A${dynamic.width} \xD7 ${dynamic.depth}mm`);
      if (!notes.includes("DYNAMIC_SIZE")) notes.push("DYNAMIC_SIZE");
    }
    if (fitted.clipped) {
      const clippedText = ["line", "track"].includes(def.visual) ? `\u706F\u5E26/\u8F68\u9053\u6309\u623F\u95F4\u8FB9\u754C\u6536\u53E3\uFF1A${Math.round(rawWidth)} \u2192 ${Math.round(fitted.width)}mm` : `\u706F\u7EC4\u6309\u623F\u95F4\u8FB9\u754C\u6536\u53E3\uFF1A${Math.round(rawWidth)} \xD7 ${Math.round(rawDepth)} \u2192 ${Math.round(fitted.width)} \xD7 ${Math.round(fitted.depth)}mm`;
      warnings.push(clippedText);
      if (!notes.includes("LINE_CLIPPED")) notes.push("LINE_CLIPPED");
    }
    const z = heightForRule(rule, room);
    return {
      id: `dev-${room.id}-${rule.pointCode}-${idx}`,
      ruleCode: rule.pointCode,
      deviceKey: def.key,
      deviceType2: def.category2,
      category1: def.category1,
      roomId: room.id,
      roomName: room.name,
      position: { x: Math.round(fitted.center[0]), y: Math.round(fitted.center[1]), z },
      rotation: c.angle,
      mount: rule.mount,
      priority: rule.priority,
      visual: def.visual,
      glow: def.glow,
      size: { width: Math.max(Math.round(fitted.width), 80), depth: Math.max(Math.round(fitted.depth), 60) },
      status,
      source: "rule",
      locked: false,
      binding: bindingForRule(rule),
      ...bomQuantity ? { quote: { inputQuantity: bomQuantity, moduleQuantity: bomQuantity, placementForm: def.visual } } : {},
      trace: {
        anchor: rule.anchor.kind,
        candidateRank: idx + 1,
        fallbackStep: status === "fallback" ? 1 : 0,
        confidence: notes.includes("NO_FURNITURE") ? 0.42 : 0.86,
        notes: [...rule.traceFlags, ...notes],
        warnings
      }
    };
  }
  function bindingForRule(rule) {
    const kind = rule.anchor.kind;
    if (kind === "windowHead") return { kind: "window", name: rule.anchor.raw };
    if (kind === "hostTrack") return { kind: "track", name: rule.anchor.raw };
    if (kind === "furnitureCenter" || kind === "furnitureEdge" || kind === "furniturePair" || kind === "cabinetShelf") {
      return { kind: "furniture", name: rule.anchor.raw };
    }
    if (kind === "wallOffset" || kind === "wallEvenDivide" || kind === "doorSideWall") {
      return { kind: "wall", name: rule.anchor.raw };
    }
    if (kind === "pathLine" || kind === "perimeter" || kind === "longAxisLine") {
      return { kind: "path", name: rule.anchor.raw };
    }
    return { kind: "room", name: rule.anchor.raw };
  }
  function makePendingDevice(rule, room, def, idx, reason, source = "rule", pending) {
    const c = polygonCentroid(room.polygon);
    return {
      id: `dev-${room.id}-${rule.pointCode}-pending-${idx}`,
      ruleCode: rule.pointCode,
      deviceKey: def.key,
      deviceType2: def.category2,
      category1: def.category1,
      roomId: room.id,
      roomName: room.name,
      position: { x: Math.round(c[0]), y: Math.round(c[1]), z: heightForRule(rule, room) },
      rotation: 0,
      mount: rule.mount,
      priority: rule.priority,
      visual: def.visual,
      glow: def.glow,
      size: { width: def.size.width, depth: def.size.depth },
      status: "pending",
      source,
      locked: false,
      binding: { kind: "pending", name: rule.anchor.raw },
      trace: {
        anchor: rule.anchor.kind,
        candidateRank: 0,
        fallbackStep: 99,
        confidence: 0.1,
        notes: [...rule.traceFlags, "PENDING_PLACEMENT", `RULE:${rule.pointCode}`],
        warnings: [reason],
        ...pending ? { pending } : {}
      }
    };
  }
  var BLOCK_LABELS = {
    OUT_OF_ROOM: "\u843D\u5728\u623F\u95F4\u5916",
    FUNCTION_ZONE_EXCLUDED: "\u843D\u5728\u529F\u80FD\u5206\u533A\u5916",
    DOOR_SWING: "\u95E8\u6247\u5F00\u542F\u533A",
    WINDOW: "\u7A97\u6D1E",
    WET_ZONE: "\u6E7F\u533A",
    TV_SCREEN: "\u7535\u89C6\u5C4F\u5E55\u7981\u5C04\u533A",
    STOVE: "\u7076\u53F0\u907F\u8BA9",
    SPACING_CONFLICT: "\u4E0E\u540C\u7C7B\u578B\u8BBE\u5907\u95F4\u8DDD\u4E0D\u8DB3"
  };
  function buildPendingDiagnostic(rule, room, project, args) {
    const types = rule.anchor.furnitureTypes ?? [];
    const furniture = types.length ? furnitureInRoom(project, room.id, types) : [];
    const blocked2 = [...new Set(args.blocked ?? [])];
    const blockedText = blocked2.filter((x) => BLOCK_LABELS[x]).map((x) => BLOCK_LABELS[x]).join("\u3001");
    const avoid = rule.collision.filter((x) => x !== "NONE");
    const requirement = [
      `\u951A\u70B9\uFF1A${rule.anchor.raw || rule.anchor.kind}`,
      `\u6570\u91CF\uFF1A${rule.quantity.raw}`,
      types.length ? `\u76EE\u6807\u5BB6\u5177\uFF1A${types.join("\u3001")}\uFF08\u627E\u5230 ${furniture.length} \u4E2A\uFF09` : "",
      avoid.length ? `\u907F\u8BA9\uFF1A${avoid.join("\u3001")}` : "",
      rule.spacing ? `\u6700\u5C0F\u95F4\u8DDD\uFF1A${rule.spacing}mm` : ""
    ].filter(Boolean).join("\uFF1B");
    const found = [
      types.length ? `\u76EE\u6807\u5BB6\u5177 ${types.join("\u3001")}\uFF1A${furniture.length} \u4E2A` : "",
      `\u951A\u70B9\u751F\u6210 ${args.generated} \u4E2A\u5019\u9009\u70B9\uFF0C${args.available} \u4E2A\u53EF\u7528`,
      `\u89C4\u5219\u9700\u8981 ${args.required} \u53F0`
    ].filter(Boolean).join("\uFF1B");
    let unmet;
    if (!args.generated) {
      unmet = types.length && !furniture.length ? `\u7F3A\u5C11\u76EE\u6807\u5BB6\u5177\u300C${types.join("\u3001")}\u300D\uFF0C\u65E0\u6CD5\u751F\u6210\u5B89\u88C5\u951A\u70B9` : "\u951A\u70B9\u672A\u751F\u6210\u5408\u6CD5\u5019\u9009\u70B9\uFF08\u7F3A\u5C11\u5B89\u88C5\u8F7D\u4F53\u6216\u53EF\u7528\u8DEF\u5F84\uFF09";
    } else if (args.required > args.generated) {
      unmet = `\u89C4\u5219\u9700\u8981 ${args.required} \u53F0\uFF0C\u951A\u70B9\u53EA\u751F\u6210 ${args.generated} \u4E2A\u5019\u9009\u70B9\uFF0C\u7F3A\u53E3 ${args.required - args.generated} \u53F0`;
    } else if (args.available < args.required) {
      const rejected = args.generated - args.available;
      unmet = blockedText ? `\u751F\u6210 ${args.generated} \u4E2A\u5019\u9009\u70B9\uFF0C\u5176\u4E2D ${rejected} \u4E2A\u88AB${blockedText}\u6392\u9664\uFF0C\u4EC5 ${args.available} \u4E2A\u53EF\u7528\uFF0C\u5C11\u4E8E ${args.required} \u53F0` : `\u5408\u6CD5\u5019\u9009\u70B9\u53EA\u6709 ${args.available} \u4E2A\uFF0C\u5C11\u4E8E\u89C4\u5219\u9700\u8981\u7684 ${args.required} \u53F0`;
    } else {
      unmet = "\u5019\u9009\u70B9\u4E0D\u8DB3\uFF0C\u65E0\u6CD5\u6EE1\u8DB3\u89C4\u5219\u6570\u91CF";
    }
    let suggestion;
    if (types.length && !furniture.length) {
      suggestion = `\u5148\u5728\u7A7A\u95F4\u5185\u8865\u5145\u300C${types.join("\u3001")}\u300D\uFF0C\u6216\u786E\u8BA4\u8BE5\u89C4\u5219\u662F\u5426\u9002\u7528\u4E8E\u5F53\u524D\u7A7A\u95F4`;
    } else if (blocked2.includes("SPACING_CONFLICT")) {
      suggestion = "\u589E\u5927\u8BBE\u5907\u95F4\u8DDD\u6216\u51CF\u5C11\u540C\u7C7B\u578B\u8BBE\u5907\u6570\u91CF\uFF0C\u4E5F\u53EF\u4EE5\u8C03\u6574\u5BB6\u5177\u4F4D\u7F6E";
    } else if (blocked2.some((x) => ["DOOR_SWING", "WINDOW", "WET_ZONE", "TV_SCREEN", "STOVE"].includes(x))) {
      suggestion = `\u8C03\u6574${blockedText}\u76F8\u5173\u5BB6\u5177/\u95E8\u7A97\u4F4D\u7F6E\u540E\u91CD\u65B0\u4E00\u952E\u5E03\u70B9`;
    } else if (args.required > args.generated) {
      suggestion = "\u8865\u5145\u8BE5\u89C4\u5219\u9700\u8981\u7684\u5019\u9009\u951A\u70B9\uFF08\u5982\u5E8A\u4FA7\u3001\u95E8\u53E3\u3001\u67DC\u4F53\uFF09\uFF0C\u6216\u6309\u89C4\u5219 fallback \u51CF\u5C11\u6570\u91CF";
    } else {
      suggestion = "\u4EBA\u5DE5\u786E\u8BA4\u5B89\u88C5\u4F4D\u7F6E\uFF0C\u6216\u8865\u5145\u5B89\u88C5\u8F7D\u4F53\u540E\u91CD\u65B0\u4E00\u952E\u5E03\u70B9";
    }
    return {
      reasonCode: args.code || blocked2[0] || "NO_AVAILABLE_CANDIDATE",
      requirement,
      found,
      unmet,
      suggestion,
      required: args.required,
      available: args.available
    };
  }
  function heightForRule(rule, room) {
    if (rule.deviceType2 === "\u53F0\u706F" && /书桌|学习桌/.test(String(rule.anchor.raw || ""))) return 750;
    if (rule.height.base === "CL") return room.ceilingHeight - (rule.height.offset ?? 0);
    if (rule.height.base === "FL") return rule.height.offset ?? 0;
    if (rule.height.base === "WL") return rule.height.offset ?? 2400;
    if (rule.height.base === "BL") return rule.height.offset ?? 900;
    return rule.height.offset ?? 1300;
  }
  function modeExcluded(rule, room) {
    const isMain = ["\u5438\u9876\u706F", "\u540A\u706F", "\u9762\u677F\u706F"].includes(rule.deviceType2);
    const isCenterGrid = rule.anchor.kind === "inscribedGrid" && rule.deviceType2 === "\u7B52\u706F";
    if (room.mode === "NO_MAIN" && isMain) return true;
    if (room.mode === "MAIN" && isCenterGrid) return true;
    return false;
  }
  function executeRule(rule, room, project, existing) {
    const def = deviceForRule(rule);
    if (!def) {
      return {
        devices: [],
        execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: "skipped", placedCount: 0, reasonCode: "PRODUCT_MISSING", reason: "\u8BBE\u5907\u76EE\u5F55\u7F3A\u5C11\u8BE5\u4E8C\u7EA7\u5206\u7C7B", traceFlags: rule.traceFlags },
        unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: "PRODUCT_MISSING", reason: "\u8BBE\u5907\u76EE\u5F55\u7F3A\u5C11\u8BE5\u4E8C\u7EA7\u5206\u7C7B", traceFlags: rule.traceFlags }
      };
    }
    if (modeExcluded(rule, room)) {
      return {
        devices: [],
        execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: "skipped", placedCount: 0, reasonCode: "MODE_EXCLUDED", reason: `\u5F53\u524D\u7A7A\u95F4\u6A21\u5F0F ${room.mode} \u4E0D\u6267\u884C\u8BE5\u4E3B\u706F/\u4E2D\u5FC3\u9635\u5217\u89C4\u5219`, traceFlags: rule.traceFlags },
        unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: "MODE_EXCLUDED", reason: `\u5F53\u524D\u7A7A\u95F4\u6A21\u5F0F ${room.mode} \u4E0D\u6267\u884C\u8BE5\u89C4\u5219`, traceFlags: rule.traceFlags }
      };
    }
    const q = quantityFor2(rule, room, project);
    if (q.count <= 0) {
      return {
        devices: [],
        execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: "executed_with_fallback", placedCount: 0, reasonCode: q.note ?? "NO_TARGET", reason: "\u6570\u91CF\u8BA1\u7B97\u7ED3\u679C\u4E3A 0", traceFlags: rule.traceFlags },
        unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: q.note ?? "NO_TARGET", reason: "\u6570\u91CF\u8BA1\u7B97\u7ED3\u679C\u4E3A 0", traceFlags: rule.traceFlags }
      };
    }
    const requested = q.count;
    const already = existing.filter(
      (d) => d.roomId === room.id && d.deviceKey === def.key && d.ruleCode === rule.pointCode
    ).length;
    const isTrackRule = rule.deviceType2.includes("\u78C1\u5438\u8F68\u9053");
    const target = isTrackRule ? already ? 0 : 1 : Math.max(0, requested - already);
    if (target === 0) {
      return {
        devices: [],
        execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: "executed", placedCount: isTrackRule ? requested : already, requestedCount: requested, pendingCount: 0, reason: "\u65E2\u6709/\u9501\u5B9A\u8BBE\u5907\u5DF2\u6EE1\u8DB3\u8BE5\u89C4\u5219\u6570\u91CF", traceFlags: rule.traceFlags }
      };
    }
    const cand = candidatesFor(rule, room, project);
    const zones = collisionZones(project, room);
    const notes = [q.note, cand.note].filter(Boolean);
    if (!cand.list.length) {
      if (rule.fallback?.includes("REMOVE")) {
        return {
          devices: [],
          execution: {
            ruleCode: rule.pointCode,
            roomId: room.id,
            roomName: room.name,
            deviceType2: rule.deviceType2,
            // REMOVE 表示“该目标不存在时取消此规则”，不计入报价请求量。
            status: "executed",
            placedCount: already,
            requestedCount: 0,
            pendingCount: 0,
            reasonCode: "NO_CARRIER",
            reason: "\u7F3A\u5C11\u5BF9\u5E94\u5BB6\u5177/\u5B89\u88C5\u8F7D\u4F53\uFF0C\u6309\u89C4\u5219 fallback=REMOVE \u53D6\u6D88",
            traceFlags: rule.traceFlags
          }
        };
      }
      const pending2 = Array.from({ length: target }, (_, i) => makePendingDevice(
        rule,
        room,
        def,
        i,
        "\u7F3A\u5C11\u5BF9\u5E94\u5BB6\u5177/\u5B89\u88C5\u8F7D\u4F53\uFF0C\u4FDD\u7559\u4E3A\u5F85\u5904\u7406",
        "rule",
        buildPendingDiagnostic(rule, room, project, { code: "NO_CARRIER", generated: 0, available: 0, required: requested })
      ));
      return {
        devices: pending2,
        execution: {
          ruleCode: rule.pointCode,
          roomId: room.id,
          roomName: room.name,
          deviceType2: rule.deviceType2,
          status: "executed_with_fallback",
          placedCount: already,
          requestedCount: requested,
          pendingCount: target,
          reasonCode: "NO_CARRIER",
          reason: "\u7F3A\u5C11\u5BF9\u5E94\u5BB6\u5177/\u5B89\u88C5\u8F7D\u4F53\uFF0C\u8BBE\u5907\u4FDD\u7559\u4E3A\u5F85\u5904\u7406",
          traceFlags: rule.traceFlags
        },
        unplaced: {
          ruleCode: rule.pointCode,
          roomId: room.id,
          roomName: room.name,
          deviceType2: rule.deviceType2,
          reasonCode: "NO_CARRIER",
          reason: "\u7F3A\u5C11\u5BF9\u5E94\u5BB6\u5177/\u5B89\u88C5\u8F7D\u4F53",
          traceFlags: rule.traceFlags,
          requestedCount: requested,
          pendingCount: target
        }
      };
    }
    const accepted = [];
    for (const c of cand.list) {
      const block = blocked(rule, c.p, room, project, zones);
      if (block) {
        if (!notes.includes(block)) notes.push(block);
        continue;
      }
      const near = nearestExisting(c.p, existing, rule);
      if (!near.ok) {
        if (!notes.includes("SPACING_CONFLICT")) notes.push("SPACING_CONFLICT");
        continue;
      }
      accepted.push(c);
      if (accepted.length >= target) break;
    }
    if (isTrackRule) {
      if (!accepted.length) {
        return {
          devices: [],
          execution: {
            ruleCode: rule.pointCode,
            roomId: room.id,
            roomName: room.name,
            deviceType2: rule.deviceType2,
            status: "executed_with_fallback",
            placedCount: already,
            requestedCount: requested,
            pendingCount: 0,
            reasonCode: "NO_TRACK_PATH",
            reason: "\u8F68\u9053\u5BBF\u4E3B\u8DEF\u5F84\u51B2\u7A81\uFF0C\u672C\u6B21\u53D6\u6D88\uFF1B\u4E0D\u751F\u6210\u91CD\u53E0\u8F68\u9053",
            traceFlags: rule.traceFlags
          }
        };
      }
      const d = makeDevice(rule, room, def, accepted[0], 0, notes.length ? "fallback" : "placed", notes, requested);
      return {
        devices: [d],
        execution: {
          ruleCode: rule.pointCode,
          roomId: room.id,
          roomName: room.name,
          deviceType2: rule.deviceType2,
          status: "executed",
          placedCount: requested + already,
          requestedCount: requested,
          pendingCount: 0,
          reason: `\u4E00\u6761\u8FDE\u7EED\u8F68\u9053\uFF0C\u957F\u5EA6\u6309\u5BBF\u4E3B\u8DEF\u5F84\u5B9E\u6D4B\uFF0C\u62A5\u4EF7\u6309 ${requested} \u4E2A\u6A21\u5757\u8BA1\u4EF7`,
          traceFlags: rule.traceFlags
        }
      };
    }
    if (!accepted.length) {
      const fallback = candidatesFor({ ...rule, anchor: { ...rule.anchor, kind: "roomCenter" } }, room, project).list[0];
      const block = fallback ? blocked(rule, fallback.p, room, project, zones) : "CONFLICT_P0";
      if (fallback && !block) {
        const d = makeDevice(rule, room, def, fallback, 0, "fallback", [...notes, "FALLBACK_ROOM_CENTER"]);
        const pendingCount2 = Math.max(0, target - 1);
        const diag2 = buildPendingDiagnostic(rule, room, project, { code: "FALLBACK_ROOM_CENTER", generated: cand.list.length, available: 1, required: requested, blocked: notes });
        const pending2 = Array.from({ length: pendingCount2 }, (_, i) => makePendingDevice(rule, room, def, i + 1, "\u539F\u89C4\u5219\u5019\u9009\u70B9\u51B2\u7A81\uFF0C\u4EC5\u4FDD\u7559\u4E00\u4E2A\u964D\u7EA7\u70B9\uFF0C\u5176\u4F59\u7B49\u5F85\u4EBA\u5DE5\u5904\u7406", "rule", diag2));
        return {
          devices: [d, ...pending2],
          execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: "executed_with_fallback", placedCount: 1 + already, requestedCount: requested, pendingCount: pendingCount2, reasonCode: pendingCount2 ? "CAPACITY_EXCEEDED" : "FALLBACK_ROOM_CENTER", reason: pendingCount2 ? `\u4EC5 1 \u53F0\u964D\u7EA7\u843D\u4F4D\uFF0C${pendingCount2} \u53F0\u4FDD\u7559\u4E3A\u5F85\u5904\u7406` : "\u5019\u9009\u70B9\u5747\u51B2\u7A81\uFF0C\u964D\u7EA7\u5230\u623F\u95F4\u4E2D\u5FC3", traceFlags: rule.traceFlags },
          ...pendingCount2 ? { unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: "CAPACITY_EXCEEDED", reason: "\u964D\u7EA7\u540E\u4ECD\u4E0D\u8DB3\uFF0C\u8BBE\u5907\u672A\u5220\u9664\uFF0C\u7B49\u5F85\u4EBA\u5DE5\u5904\u7406", traceFlags: rule.traceFlags, requestedCount: requested, pendingCount: pendingCount2 } } : {}
        };
      }
      return {
        devices: Array.from({ length: target }, (_, i) => makePendingDevice(
          rule,
          room,
          def,
          i,
          "\u5019\u9009\u70B9\u5747\u88AB\u7981\u5E03\u533A\u3001\u8BBE\u5907\u5916\u8F6E\u5ED3\u6216\u95F4\u8DDD\u7EA6\u675F\u6392\u9664",
          "rule",
          buildPendingDiagnostic(rule, room, project, { code: block || "CONFLICT_P0", generated: cand.list.length, available: 0, required: requested, blocked: notes })
        )),
        execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: "executed_with_fallback", placedCount: already, requestedCount: requested, pendingCount: target, reasonCode: block || "CONFLICT_P0", reason: "\u5019\u9009\u70B9\u5747\u88AB\u7981\u5E03\u533A\u3001\u8BBE\u5907\u5916\u8F6E\u5ED3\u6216\u95F4\u8DDD\u7EA6\u675F\u6392\u9664\uFF0C\u8BBE\u5907\u4FDD\u7559\u5728\u5F85\u5904\u7406\u6E05\u5355", traceFlags: rule.traceFlags },
        unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: block || "CONFLICT_P0", reason: "\u5019\u9009\u70B9\u5747\u88AB\u7981\u5E03\u533A\u3001\u8BBE\u5907\u5916\u8F6E\u5ED3\u6216\u95F4\u8DDD\u7EA6\u675F\u6392\u9664", traceFlags: rule.traceFlags, requestedCount: requested, pendingCount: target }
      };
    }
    const out = [];
    const count = Math.min(target, accepted.length);
    for (let i = 0; i < count; i++) {
      const c = { ...accepted[i] };
      if (q.stripLengthMm && def.glow === "line" && rule.anchor.kind !== "perimeter") c.length = q.stripLengthMm / Math.max(count, 1);
      out.push(makeDevice(rule, room, def, c, i, notes.length ? "fallback" : "placed", notes));
    }
    const pendingCount = Math.max(0, target - out.length);
    const diag = buildPendingDiagnostic(rule, room, project, { code: pendingCount ? "CAPACITY_EXCEEDED" : "NO_AVAILABLE_CANDIDATE", generated: cand.list.length, available: accepted.length, required: requested, blocked: notes });
    const pending = Array.from({ length: pendingCount }, (_, i) => makePendingDevice(rule, room, def, out.length + i, "\u5408\u6CD5\u5019\u9009\u70B9\u4E0D\u8DB3\uFF0C\u4FDD\u7559\u4E3A\u5F85\u5904\u7406\u8BBE\u5907", "rule", diag));
    const status = notes.length || pendingCount ? "executed_with_fallback" : "executed";
    return {
      devices: [...out, ...pending],
      execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status, placedCount: out.length + already, requestedCount: requested, pendingCount, reasonCode: pendingCount ? "CAPACITY_EXCEEDED" : notes[0], reason: pendingCount ? `${pendingCount} \u53F0\u4FDD\u7559\u4E3A\u5F85\u5904\u7406\uFF1A\u5408\u6CD5\u5019\u9009\u70B9\u4E0D\u8DB3` : notes.length ? notes.join(",") : void 0, traceFlags: rule.traceFlags },
      ...pendingCount ? { unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: "CAPACITY_EXCEEDED", reason: "\u5408\u6CD5\u5019\u9009\u70B9\u4E0D\u8DB3\uFF0C\u8BBE\u5907\u672A\u5220\u9664\uFF0C\u7B49\u5F85\u4EBA\u5DE5\u5904\u7406", traceFlags: rule.traceFlags, requestedCount: requested, pendingCount } } : {}
    };
  }
  function addCombinationDevices(project, devices) {
    const out = [];
    const trackKeys = /* @__PURE__ */ new Set(["\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u706F\u4F53", "\u78C1\u5438\u683C\u6805\u706F \xB7 \u706F\u4F53"]);
    for (const d of devices) {
      if (d.deviceType2 === "\u7A97\u5E18\u7535\u673A") {
        const def = DEVICE_BY_KEY["\u7A97\u5E18\u7535\u673A \xB7 \u7535\u52A8\u8F68\u9053"];
        if (def) {
          out.push({
            ...d,
            id: `${d.id}-track`,
            deviceKey: def.key,
            deviceType2: def.category2,
            priority: "P3",
            visual: def.visual,
            glow: "line",
            size: { width: 1800, depth: 60 },
            trace: { ...d.trace, notes: [...d.trace.notes, "CHILD_TRACK"] }
          });
        }
      }
      if (trackKeys.has(d.deviceKey) && d.deviceType2.includes("\u78C1\u5438")) {
        const def = DEVICE_BY_KEY["\u78C1\u5438\u6CDB\u5149\u706F \xB7 \u78C1\u5438\u8F68\u9053"];
        const hasTrack = [...devices, ...out].some((x) => x.roomId === d.roomId && x.deviceKey === def?.key);
        if (def && !hasTrack) {
          out.push({
            ...d,
            id: `${d.id}-track`,
            deviceKey: def.key,
            deviceType2: def.category2,
            priority: "P3",
            visual: def.visual,
            glow: "line",
            size: { width: 1200, depth: 60 },
            trace: { ...d.trace, notes: [...d.trace.notes, "SHARED_TRACK"] }
          });
        }
      }
    }
    if (project.id === "demo-15spaces") {
      const living = project.rooms.find((r) => r.spaceCode === "KT");
      const dining = project.rooms.find((r) => r.spaceCode === "CT");
      const mk = (room, key, x, y, w, d, angle = 0) => {
        if (!room) return;
        const def = DEVICE_BY_KEY[key];
        if (!def) return;
        const fitted = fitDeviceGeometry(room, [x, y], angle, w, d, def.visual);
        out.push({
          id: `demo-combo-${key}-${room.id}`,
          ruleCode: "DEMO-COMBO",
          deviceKey: def.key,
          deviceType2: def.category2,
          category1: def.category1,
          roomId: room.id,
          roomName: room.name,
          position: { x: Math.round(fitted.center[0]), y: Math.round(fitted.center[1]), z: room.ceilingHeight - 50 },
          rotation: angle,
          mount: "CL",
          priority: "P3",
          visual: def.visual,
          glow: def.glow,
          size: { width: Math.round(fitted.width), depth: Math.round(fitted.depth) },
          status: "placed",
          source: "rule",
          locked: false,
          trace: {
            anchor: "perimeter",
            candidateRank: 0,
            fallbackStep: 0,
            confidence: 1,
            notes: ["DEMO_COMBINATION", ...fitted.clipped ? ["LINE_CLIPPED"] : []],
            warnings: fitted.clipped ? ["Demo \u7EC4\u5408\u706F\u5F62\u5DF2\u6309\u623F\u95F4\u8FB9\u754C\u6536\u53E3"] : []
          }
        });
      };
      if (living) {
        const b = bboxOf(living.polygon);
        mk(living, "L \u578B\u706F\u5E26", b.x + 600, b.y + 600, 1800, 800, 0);
        mk(living, "\u7B52\u706F\u53E3\u5B57\u7EC4", b.x + b.w - 1e3, b.y + b.h - 1e3, 800, 800, 0);
      }
      if (dining) {
        const b = bboxOf(dining.polygon);
        mk(dining, "\u53E3\u5B57\u706F\u5E26", b.x + b.w / 2, b.y + b.h / 2, 1600, 1600, 0);
      }
    }
    return out;
  }
  function wholeHousePass(project) {
    const publicRoom = (code) => project.rooms.find((r) => r.spaceCode === code);
    const nonBedroom = project.rooms.find((r) => !["ZW", "WS", "LRF", "XHF"].includes(r.spaceCode));
    const entry = publicRoom("XCW") ?? publicRoom("GDYT") ?? publicRoom("KT") ?? nonBedroom ?? project.rooms[0];
    const hall = project.rooms.find((r) => r.spaceCode === "GDYT") ?? entry;
    const living = project.rooms.find((r) => r.spaceCode === "KT") ?? entry;
    const study = project.rooms.find((r) => r.spaceCode === "SF") ?? hall;
    const out = [];
    const push = (key, room, p, z, binding) => {
      const def = DEVICE_BY_KEY[key];
      if (!def) return;
      out.push({
        id: `whole-${key}`,
        ruleCode: "WHOLE-HOUSE",
        deviceKey: def.key,
        deviceType2: def.category2,
        category1: def.category1,
        roomId: "__whole",
        roomName: "\u5168\u5C4B\u57FA\u7840\u5305",
        position: { x: Math.round(p[0]), y: Math.round(p[1]), z },
        rotation: 0,
        mount: def.mount,
        priority: "P2",
        visual: def.visual,
        glow: "none",
        size: def.size,
        status: "placed",
        source: "wholeHouse",
        locked: false,
        binding,
        trace: {
          anchor: "wholeHouse",
          candidateRank: 1,
          fallbackStep: 0,
          confidence: 0.9,
          notes: [`HOST_ROOM:${room.name}`, "WHOLE_HOUSE_BASIC"],
          warnings: []
        }
      });
    };
    const entryWall = doorSideCandidates(entry, project, 220)[0] ?? { p: polygonCentroid(entry.polygon), angle: 0 };
    const ux = Math.cos(entryWall.angle * Math.PI / 180);
    const uy = Math.sin(entryWall.angle * Math.PI / 180);
    const weakKeys = ["\u5F31\u7535\u7BB1 \xB7 \u7BB1\u4F53", "\u5F31\u7535\u7BB1 \xB7 PoE \u8DEF\u7531", "\u5F31\u7535\u7BB1 \xB7 Mesh \u4E3B\u8DEF\u7531", "\u5F31\u7535\u7BB1 \xB7 PoE \u4EA4\u6362\u673A", "\u5F31\u7535\u7BB1 \xB7 \u4EA4\u6362\u673A", "\u4EA4\u6362\u673A"];
    weakKeys.forEach((key, i) => {
      const offset = (i - (weakKeys.length - 1) / 2) * 150;
      let p = [entryWall.p[0] + ux * offset, entryWall.p[1] + uy * offset];
      if (!pointInPolygon(p, entry.polygon)) p = entryWall.p;
      push(key, entry, p, 1350, { kind: "wall", name: `\u5F31\u7535\u7BB1 \xB7 ${entry.name}` });
    });
    const hallC = polygonCentroid(hall.polygon);
    push("\u84DD\u7259 Mesh \u7F51\u5173", hall, hallC, hall.ceilingHeight - 100, { kind: "room", name: hall.name });
    push("\u9876\u88C5 AP", hall, [hallC[0] + 350, hallC[1]], hall.ceilingHeight - 50, { kind: "room", name: hall.name });
    push("Mesh \u8DEF\u7531\u5668", living, polygonCentroid(living.polygon), 800, { kind: "furniture", name: "\u5BA2\u5385\u7535\u89C6\u67DC/\u8BBE\u5907\u4F4D" });
    const studyWall = doorSideCandidates(study, project, 175)[0] ?? { p: polygonCentroid(study.polygon), angle: 0 };
    push("\u9762\u677F AP", study, studyWall.p, 1300, { kind: "wall", name: study.name });
    return out;
  }
  function runLayout(project, options = {}) {
    const rooms = options.mode === "currentRoom" && options.roomId ? project.rooms.filter((r) => r.id === options.roomId) : project.rooms;
    const devices = [];
    const unplaced = [];
    const executions = [];
    const existing = options.preserveLocked === false ? [] : project.devices.filter((d) => d.locked);
    const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P0: 0 };
    for (const room of rooms) {
      const roomRules = rulesForRoom(room.spaceCode).slice().sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.deviceType2.localeCompare(b.deviceType2) || a.pointCode.localeCompare(b.pointCode));
      for (const rule of roomRules) {
        const r = executeRule(rule, room, project, [...existing, ...devices]);
        devices.push(...r.devices);
        if (r.unplaced) unplaced.push(r.unplaced);
        executions.push(r.execution);
      }
    }
    const combo = addCombinationDevices(project, devices);
    const allDevices = [...devices, ...combo];
    const locked = options.preserveLocked === false ? [] : project.devices.filter((d) => d.locked);
    const manual = options.sources?.length === 0 ? [] : project.devices.filter((d) => d.source === "manual" && !d.locked);
    const lockedIds = new Set(locked.map((d) => d.id));
    const manualIds = new Set(manual.map((d) => d.id));
    const merged = [
      ...allDevices.filter((d) => !lockedIds.has(d.id) && !manualIds.has(d.id)),
      ...manual,
      ...locked
    ];
    return {
      devices: merged,
      wholeHouseDevices: wholeHousePass(project),
      unplaced,
      executions,
      diagnostics: [
        `\u89C4\u5219\u7248\u672C ${DEMO_DEFAULTS.ruleVersion}`,
        `\u6267\u884C ${executions.length} \u6761\u89C4\u5219\uFF0C\u843D\u4F4D ${merged.length} \u4E2A\u8BBE\u5907`,
        `\u672A\u843D\u4F4D ${unplaced.length} \u6761`,
        `${project.id === "demo-15spaces" ? "15 \u7A7A\u95F4\u6F14\u793A\u6237\u578B" : "\u4E09\u5BA4\u4E24\u5385\u793A\u4F8B"} \xB7 ${rooms.length} \u4E2A\u7A7A\u95F4`
      ],
      ruleVersion: DEMO_DEFAULTS.ruleVersion,
      engineVersion: DEMO_DEFAULTS.engineVersion,
      seed: project.seed
    };
  }
  function genericCandidatesForDevice(room, def, project) {
    const c = polygonCentroid(room.polygon);
    if (["rect", "l", "u", "array", "pointRect"].includes(def.visual)) return [{ p: c, angle: 0 }];
    if (def.visual === "track") return longAxisPoints(room, 3);
    if (def.category1 === "\u63A7\u5236") return doorSideCandidates(room, project, 175);
    if (def.category1 === "\u906E\u9633") return windowCandidates(project, room);
    if (def.category1 === "\u6696\u901A") return wallOffsetPoints(room, 350);
    if (def.category1 === "\u97F3\u4E50") {
      const sofa = furnitureInRoom(project, room.id, ["sofa", "teaTable", "diningTable"])[0];
      if (sofa) return furniturePoints(sofa, "center", c).map((p) => ({ p, angle: sofa.rotation }));
    }
    if (def.category1 === "\u7F51\u7EDC") return [{ p: c, angle: 0 }];
    if (def.glow === "line") {
      if (def.category2.includes("\u706F\u69FD") || def.category2.includes("\u8D34\u5899")) return perimeterPoints(room, 120);
      if (def.category2.includes("\u7A97\u5E18")) return windowCandidates(project, room);
      if (def.category2.includes("\u67DC\u4F53")) {
        const fs = furnitureInRoom(project, room.id, ["wardrobe", "tvCabinet", "bookshelf", "displayCabinet", "upperCabinet"]);
        return fs.flatMap((f) => furniturePoints(f, "edge", c).map((p) => ({ p, angle: f.rotation, length: Math.max(f.rect[2], f.rect[3]) })));
      }
      return longAxisPoints(room, 3);
    }
    return wallOffsetPoints(room, 250);
  }
  function deviceRuleMatches(rule, def) {
    return ruleMatchesDeviceKey(rule, def.key);
  }
  function rulesForDevice(spaceCode, deviceKey) {
    const def = DEVICE_BY_KEY[deviceKey] ?? findDevice(deviceKey);
    if (!def) return [];
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    const spaceRules = rulesForRoom(spaceCode).filter((r) => deviceRuleMatches(r, def)).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.pointCode.localeCompare(b.pointCode));
    if (spaceRules.length) return spaceRules;
    return CROSS_RULE_TEMPLATES.filter((t) => t.deviceKey === def.key).map((t) => ({
      ...t,
      spaceCode,
      spaceName: SPACE_BY_CODE[spaceCode]?.name ?? spaceCode
    }));
  }
  function crossRuleForCode(code, spaceCode) {
    const template = CROSS_RULE_BY_CODE.get(code);
    if (!template) return null;
    return {
      ...template,
      spaceCode,
      spaceName: SPACE_BY_CODE[spaceCode]?.name ?? spaceCode
    };
  }
  function placeExistingDevices(project, options = {}) {
    const rooms = options.mode === "currentRoom" && options.roomId ? project.rooms.filter((r) => r.id === options.roomId) : project.rooms;
    const devices = project.devices.map((d) => ({
      ...d,
      position: { ...d.position },
      trace: { ...d.trace, notes: [...d.trace.notes], warnings: [...d.trace.warnings] }
    }));
    const locked = devices.filter((d) => d.locked);
    const occupied = [...locked];
    const executions = [];
    const unplaced = [];
    for (const room of rooms) {
      const sources = options.sources ?? ["manual"];
      const roomDevices = devices.filter((d) => d.roomId === room.id && !d.locked && sources.includes(d.source));
      if (!roomDevices.length) continue;
      const groups = /* @__PURE__ */ new Map();
      for (const d of roomDevices) {
        const key = `${d.deviceKey}|${d.category1}|${d.deviceType2}|${d.source === "rule" ? d.ruleCode : ""}`;
        const arr = groups.get(key) ?? [];
        arr.push(d);
        groups.set(key, arr);
      }
      const zones = collisionZones(project, room);
      for (const group of groups.values()) {
        const first = group[0];
        const def = DEVICE_BY_KEY[first.deviceKey] ?? findDevice(first.deviceType2);
        let matchedRules = def ? rulesForDevice(room.spaceCode, def.key) : [];
        if (first.source === "rule" && first.ruleCode) {
          const pinned = matchedRules.filter((r) => r.pointCode === first.ruleCode);
          if (pinned.length) matchedRules = pinned;
        }
        const candidates = [];
        for (const rule of matchedRules) {
          for (const c of candidatesFor(rule, room, project).list) {
            if (blocked(rule, c.p, room, project, zones)) continue;
            candidates.push({ c, rule });
          }
        }
        if (!matchedRules.length && def) {
          const base = def.mount;
          const genericRule = {
            pointCode: "EXISTING-GENERIC",
            spaceCode: room.spaceCode,
            spaceName: room.name,
            deviceType2: def.category2,
            usage: "\u73B0\u6709\u8BBE\u5907\u901A\u7528\u5E03\u70B9",
            mount: base,
            height: {
              base,
              offset: base === "SL" ? 1300 : base === "WL" ? 2400 : base === "BL" ? 900 : 0
            },
            anchor: {
              kind: def.visual === "line" ? "perimeter" : def.visual === "track" ? "longAxisLine" : "roomCenter",
              raw: "\u73B0\u6709\u8BBE\u5907\u901A\u7528\u5E03\u70B9"
            },
            quantity: { kind: "fixed", value: 1, raw: "1" },
            spacing: 220,
            priority: "P3",
            collision: [],
            fallback: ["REMOVE"],
            sourceText: "\u73B0\u6709\u8BBE\u5907\u901A\u7528\u5E03\u70B9",
            traceFlags: ["NO_RULE_FALLBACK"]
          };
          for (const c of genericCandidatesForDevice(room, def, project)) {
            if (blocked(genericRule, c.p, room, project, zones)) continue;
            candidates.push({ c, rule: genericRule });
          }
        }
        const seen = /* @__PURE__ */ new Set();
        const unique = candidates.filter((x) => {
          const k = `${Math.round(x.c.p[0])},${Math.round(x.c.p[1])},${Math.round(x.c.angle)}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        const matchedCode = matchedRules[0]?.pointCode ?? (def ? "EXISTING-GENERIC" : "EXISTING");
        let fallbackCount = 0;
        let used = 0;
        for (const d of group) {
          const picked = unique.find((x) => {
            const near = nearestExisting(x.c.p, occupied, x.rule);
            return near.ok && !occupied.some((o) => Math.hypot(o.position.x - x.c.p[0], o.position.y - x.c.p[1]) < 60);
          });
          if (picked) {
            const { c, rule } = picked;
            const b = bboxOf(room.polygon);
            const maxStrip = Math.max(b.w, b.h) * 1.15;
            const visual = def?.visual ?? d.visual;
            const dynamic = ["rect", "l", "u"].includes(visual) ? dynamicBoxSize(room) : null;
            const rawWidth = dynamic?.width ?? (c.length && def?.glow === "line" ? Math.min(c.length, maxStrip) : def?.size.width ?? d.size.width);
            const rawDepth = dynamic?.depth ?? (def?.size.depth ?? d.size.depth);
            const fitted = fitDeviceGeometry(room, c.p, c.angle, Math.max(rawWidth, 60), rawDepth, visual);
            const clipWarnings = [
              ...dynamic ? [`\u706F\u7EC4\u5C3A\u5BF8\u6309\u7A7A\u95F4\u53EF\u7528\u9762\u79EF\u52A8\u6001\u8BA1\u7B97\uFF1A${dynamic.width} \xD7 ${dynamic.depth}mm`] : [],
              ...fitted.clipped ? [`\u6309\u623F\u95F4\u8FB9\u754C\u6536\u53E3\uFF1A${Math.round(rawWidth)} \u2192 ${Math.round(fitted.width)}mm`] : []
            ];
            d.deviceKey = def?.key ?? d.deviceKey;
            d.deviceType2 = def?.category2 ?? d.deviceType2;
            d.category1 = def?.category1 ?? d.category1;
            d.ruleCode = rule.pointCode;
            d.position = { x: Math.round(fitted.center[0]), y: Math.round(fitted.center[1]), z: heightForRule(rule, room) };
            d.rotation = c.angle;
            d.mount = rule.mount;
            d.priority = rule.priority;
            d.visual = visual;
            d.glow = def?.glow ?? d.glow;
            d.size = {
              width: Math.max(Math.round(fitted.width), 80),
              depth: Math.max(Math.round(fitted.depth), 60)
            };
            d.status = "placed";
            d.trace = {
              anchor: rule.anchor.kind,
              candidateRank: used + 1,
              fallbackStep: 0,
              confidence: 0.9,
              notes: [
                "EXISTING_DEVICE_PLACEMENT",
                `RULE:${rule.pointCode}`,
                ...rule.traceFlags,
                ...fitted.clipped ? ["LINE_CLIPPED"] : [],
                ...dynamic ? ["DYNAMIC_SIZE"] : []
              ],
              warnings: clipWarnings
            };
            occupied.push(d);
            used++;
          } else {
            fallbackCount++;
            d.ruleCode = matchedCode;
            if (matchedRules[0]) {
              d.mount = matchedRules[0].mount;
              d.priority = matchedRules[0].priority;
            }
            d.status = "pending";
            d.trace = {
              ...d.trace,
              anchor: matchedRules[0]?.anchor.kind ?? "roomCenter",
              candidateRank: 0,
              fallbackStep: 1,
              confidence: 0.45,
              notes: [
                "EXISTING_DEVICE_PLACEMENT",
                `RULE:${matchedCode}`,
                "NO_AVAILABLE_CANDIDATE"
              ],
              warnings: [
                "\u5019\u9009\u70B9\u4E0D\u8DB3\uFF0C\u8BBE\u5907\u4FDD\u7559\u4E3A\u5F85\u5904\u7406\uFF0C\u4E0D\u81EA\u52A8\u79FB\u5230\u623F\u95F4\u4E2D\u5FC3"
              ]
            };
          }
        }
        const status = fallbackCount ? "executed_with_fallback" : "executed";
        executions.push({
          ruleCode: matchedCode,
          roomId: room.id,
          roomName: room.name,
          deviceType2: first.deviceType2,
          status,
          placedCount: used,
          requestedCount: group.length,
          pendingCount: fallbackCount,
          reasonCode: fallbackCount ? "NO_AVAILABLE_CANDIDATE" : void 0,
          reason: fallbackCount ? `\u90E8\u5206\u8BBE\u5907\u6CA1\u6709\u53EF\u7528\u5019\u9009\u70B9\uFF0C\u5DF2\u4FDD\u7559\u4E3A\u5F85\u5904\u7406\uFF08\u89C4\u5219 ${matchedCode}\uFF09` : `\u547D\u4E2D ${matchedCode}\uFF0C\u5DF2\u6309\u89C4\u5219\u951A\u70B9\u5E03\u70B9`,
          traceFlags: ["EXISTING_DEVICE_PLACEMENT"]
        });
      }
    }
    return {
      devices,
      wholeHouseDevices: project.wholeHouseDevices,
      unplaced,
      executions,
      diagnostics: [
        `\u6309\u73B0\u6709\u8BBE\u5907\u5E03\u70B9\uFF1A${devices.filter((d) => d.status === "placed" || d.status === "fallback").length} \u4E2A\u5DF2\u843D\u4F4D`,
        `\u5F85\u5904\u7406 ${devices.filter((d) => d.status === "pending").length} \u4E2A\uFF0C\u8F93\u5165\u6570\u91CF\u4FDD\u6301\u4E0D\u53D8`,
        `\u8986\u76D6 ${executions.length} \u4E2A\u8BBE\u5907\u7EC4 / ${new Set(executions.map((e) => e.roomId)).size} \u4E2A\u7A7A\u95F4`,
        `\u515C\u5E95 ${executions.filter((e) => e.status === "executed_with_fallback").length} \u7EC4`
      ],
      ruleVersion: DEMO_DEFAULTS.ruleVersion,
      engineVersion: DEMO_DEFAULTS.engineVersion,
      seed: project.seed
    };
  }
  function rulesForSpace(spaceCode) {
    return rulesForRoom(spaceCode);
  }
  function allRules() {
    return RULES;
  }

  // src/core/explain.ts
  var ANCHOR_LABELS = {
    roomCenter: "\u623F\u95F4\u4E2D\u5FC3",
    inscribedRectCenter: "\u6700\u5927\u5185\u63A5\u77E9\u5F62\u4E2D\u5FC3",
    inscribedGrid: "\u5185\u63A5\u77E9\u5F62\u7F51\u683C\u9635\u5217",
    longAxisLine: "\u623F\u95F4\u957F\u8F74\u4E2D\u7EBF",
    wallOffset: "\u6CBF\u5899\u9000\u8DDD",
    wallEvenDivide: "\u5899\u9762\u7B49\u5206",
    doorSideWall: "\u95E8\u4FA7\u5899\u9762",
    furnitureCenter: "\u5BB6\u5177\u4E2D\u5FC3",
    furniturePair: "\u5BB6\u5177\u6210\u5BF9\uFF08\u5E8A\u5934\u67DC\uFF09",
    furnitureEdge: "\u5BB6\u5177\u8FB9\u7F18",
    windowHead: "\u7A97\u6D1E / \u7A97\u9876",
    pathLine: "\u901A\u884C\u8DEF\u5F84",
    hostTrack: "\u5BBF\u4E3B\u8F68\u9053",
    cabinetShelf: "\u67DC\u5185\u5C42\u677F / \u67DC\u4F53",
    perimeter: "\u623F\u95F4\u5468\u5708",
    wholeHouse: "\u5168\u5C4B\u7EA7"
  };
  var MOUNT_LABELS2 = {
    FL: "\u5B8C\u6210\u5730\u9762 FL",
    CL: "\u540A\u9876\u5B8C\u6210\u9762 CL",
    SL: "\u5899\u9762\u5B8C\u6210\u9762 SL",
    WL: "\u7A97\u9876 WL",
    BL: "\u67DC\u5E95 / \u53F0\u9762 BL"
  };
  var PRIORITY_LABELS = {
    P0: "\u5B89\u5168\u4E0E\u4E0D\u53EF\u5E03",
    P1: "\u529F\u80FD\u91CD\u70B9\u4F4D",
    P2: "\u57FA\u7840\u7167\u660E / \u57FA\u7840\u4EA4\u4E92",
    P3: "\u6C1B\u56F4\u4E0E\u589E\u5F3A",
    P4: "\u88C5\u9970\u8865\u4F4D"
  };
  var NOTE_LABELS = {
    MANUAL_PLACEMENT: "\u624B\u52A8\u653E\u7F6E\uFF0C\u5C1A\u672A\u5E03\u70B9",
    EXISTING_DEVICE_PLACEMENT: "\u73B0\u6709\u8BBE\u5907\u5E03\u70B9",
    NO_AVAILABLE_CANDIDATE: "\u65E0\u53EF\u7528\u5019\u9009\u70B9\uFF0C\u5DF2\u515C\u5E95",
    DEMO_COMBINATION: "Demo \u7EC4\u5408\u706F\u6548",
    CHILD_TRACK: "\u8054\u52A8\u751F\u6210\u7535\u52A8\u8F68\u9053",
    SHARED_TRACK: "\u5171\u4EAB\u78C1\u5438\u8F68\u9053",
    NO_FURNITURE: "\u672A\u627E\u5230\u5BB6\u5177\uFF0C\u5DF2\u964D\u7EA7",
    NO_TARGET: "\u672A\u627E\u5230\u76EE\u6807\u6D1E\u53E3 / \u5BB6\u5177",
    SPACING_CONFLICT: "\u4E0E\u5DF2\u5E03\u8BBE\u5907\u95F4\u8DDD\u4E0D\u8DB3",
    FALLBACK_ROOM_CENTER: "\u5019\u9009\u70B9\u51B2\u7A81\uFF0C\u964D\u7EA7\u5230\u623F\u95F4\u4E2D\u5FC3",
    BED_SIDE_FALLBACK: "\u6309\u5E8A\u4E24\u4FA7\u63A8\u7B97",
    HOST_TRACK_FALLBACK: "\u5BBF\u4E3B\u8F68\u9053\u964D\u7EA7",
    GENERIC_COUNT: "\u6570\u91CF\u53D6 Demo \u9ED8\u8BA4\u503C",
    GENERIC_ANCHOR: "\u951A\u70B9\u53D6 Demo \u9ED8\u8BA4\u503C",
    DEMO_DEFAULT: "\u53C2\u6570\u4E3A Demo \u9ED8\u8BA4\u503C",
    OPTIONAL_OR_RANGE: "\u539F\u6587\u4E3A\u53EF\u9009 / \u533A\u95F4",
    CABINET_LENGTH: "\u6309\u67DC\u4F53\u957F\u5EA6\u8BA1\u7B97",
    PERIMETER: "\u6309\u623F\u95F4\u5468\u5708\u5E03\u70B9",
    LINE_CLIPPED: "\u706F\u5E26 / \u8F68\u9053\u6309\u623F\u95F4\u8FB9\u754C\u6536\u53E3",
    MEASURED_AFTER_LAYOUT: "\u957F\u5EA6\u6309\u5E03\u7F6E\u540E\u8DEF\u5F84\u5B9E\u6D4B",
    DYNAMIC_SIZE: "\u6309\u7A7A\u95F4\u9762\u79EF\u52A8\u6001\u8C03\u6574\u706F\u7EC4\u5C3A\u5BF8"
  };
  var REASON_LABELS = {
    NO_CEILING: "\u65E0\u540A\u9876",
    NO_WALL: "\u65E0\u53EF\u7528\u6237\u5899\u9762",
    NO_TARGET: "\u65E0\u76EE\u6807\u6D1E\u53E3 / \u5BB6\u5177",
    NO_FURNITURE: "\u7A7A\u95F4\u5185\u6CA1\u6709\u76EE\u6807\u5BB6\u5177",
    SPACE_TOO_SMALL: "\u7A7A\u95F4\u5C3A\u5BF8\u4E0D\u8DB3",
    CONFLICT_P0: "\u5019\u9009\u70B9\u843D\u5728 P0 \u7981\u5E03\u533A",
    CAPACITY_EXCEEDED: "\u8D85\u51FA\u5355\u89C4\u5219\u8BBE\u5907\u4E0A\u9650",
    PRODUCT_MISSING: "\u8BBE\u5907\u76EE\u5F55\u7F3A\u5C11\u8BE5\u5206\u7C7B",
    MODE_EXCLUDED: "\u5F53\u524D\u65B9\u6848\u6A21\u5F0F\u4E0D\u6267\u884C\u8BE5\u89C4\u5219",
    FALLBACK_ROOM_CENTER: "\u5019\u9009\u70B9\u5747\u51B2\u7A81\uFF0C\u964D\u7EA7\u5230\u623F\u95F4\u4E2D\u5FC3",
    SPACING_CONFLICT: "\u4E0E\u5DF2\u5E03\u8BBE\u5907\u95F4\u8DDD\u4E0D\u8DB3",
    DOOR_SWING: "\u843D\u5728\u95E8\u6247\u5F00\u542F\u533A",
    WINDOW: "\u843D\u5728\u7A97\u6D1E\u907F\u8BA9\u533A",
    WET_ZONE: "\u843D\u5728\u6E7F\u533A",
    STOVE: "\u843D\u5728\u7076\u53F0\u907F\u8BA9\u533A",
    TV_SCREEN: "\u843D\u5728\u7535\u89C6\u5C4F\u5E55\u907F\u8BA9\u533A",
    NO_AVAILABLE_CANDIDATE: "\u6CA1\u6709\u53EF\u7528\u5019\u9009\u70B9"
  };
  var GENERIC_ANCHOR_REASON = [
    { test: (d) => ["rect", "l", "u", "array", "pointRect"].includes(d.visual), text: "\u7EC4\u5408\u706F\u5F62\u4FDD\u6301\u6574\u4F53\u8F6E\u5ED3\uFF0C\u53D6\u623F\u95F4\u4E2D\u5FC3\u4F5C\u4E3A\u6574\u4F53\u5B9A\u4F4D\u70B9" },
    { test: (d) => d.visual === "track", text: "\u8F68\u9053\u7C7B\u6CBF\u623F\u95F4\u957F\u8F74\u5C55\u5F00\uFF0C\u4FDD\u8BC1\u706F\u5934\u6709\u8FDE\u7EED\u5B89\u88C5\u9762" },
    { test: (d) => d.category1 === "\u63A7\u5236", text: "\u63A7\u5236\u9762\u677F\u5C5E\u4E8E\u5165\u53E3\u4EA4\u4E92\uFF0C\u53D6\u95E8\u4FA7\u5899\u9762" },
    { test: (d) => d.category1 === "\u906E\u9633", text: "\u906E\u9633\u8BBE\u5907\u5FC5\u987B\u8D34\u7A97\uFF0C\u53D6\u7A97\u6D1E\u5185\u4FA7" },
    { test: (d) => d.category1 === "\u6696\u901A", text: "\u6696\u901A\u8BBE\u5907\u6CBF\u5899\u9000\u8DDD 350mm\uFF0C\u907F\u5F00\u4EBA\u5458\u6D3B\u52A8\u533A" },
    { test: (d) => d.category1 === "\u97F3\u4E50", text: "\u97F3\u4E50\u8BBE\u5907\u9760\u8FD1\u6C99\u53D1 / \u8336\u51E0 / \u9910\u684C\u7B49\u4E3B\u8981\u505C\u7559\u70B9" },
    { test: (d) => d.glow === "line" && d.deviceType2.includes("\u67DC\u4F53"), text: "\u67DC\u4F53\u706F\u5E26\u6CBF\u67DC\u4F53\u8FB9\u7F18\u5E03\u7F6E" },
    { test: (d) => d.glow === "line" && (d.deviceType2.includes("\u706F\u69FD") || d.deviceType2.includes("\u8D34\u5899")), text: "\u706F\u69FD / \u8D34\u5899\u706F\u5E26\u6CBF\u623F\u95F4\u5468\u5708\u5E03\u7F6E" },
    { test: (d) => d.glow === "line" && d.deviceType2.includes("\u7A97\u5E18"), text: "\u7A97\u5E18\u706F\u5E26\u6CBF\u7A97\u6D1E\u5E03\u7F6E" },
    { test: (d) => d.glow === "line", text: "\u7EBF\u578B\u8BBE\u5907\u6CBF\u623F\u95F4\u957F\u8F74\u5E03\u7F6E" },
    { test: () => true, text: "\u5176\u4F59\u8BBE\u5907\u6CBF\u5899\u9000\u8DDD 250mm\uFF0C\u4F18\u5148\u5360\u7528\u53EF\u7528\u5899\u9762" }
  ];
  function noteText(note) {
    if (note.startsWith("RULE:")) return `\u547D\u4E2D\u89C4\u5219 ${note.slice(5)}`;
    return NOTE_LABELS[note] ?? note;
  }
  function explainNotes(notes) {
    return notes.map(noteText);
  }
  function reasonText(reason) {
    if (!reason) return "";
    return reason.split(",").map((s) => s.trim()).filter(Boolean).map((code) => REASON_LABELS[code] ? `${REASON_LABELS[code]}\uFF08${code}\uFF09` : code).join(" \u2192 ");
  }
  function spaceName(device, project) {
    if (device.roomId === "__whole") return device.roomName;
    const room = project.rooms.find((r) => r.id === device.roomId);
    if (!room) return device.roomName;
    const typeName = SPACE_BY_CODE[room.spaceCode].name;
    return room.name === typeName ? room.name : `${room.name}\uFF08${typeName}\uFF09`;
  }
  function countSameRule(device, project) {
    if (["MANUAL", "DEMO-COMBO", "EXISTING-GENERIC", "WHOLE-HOUSE", "EXISTING"].includes(device.ruleCode)) {
      return project.devices.filter((d) => d.deviceKey === device.deviceKey && d.roomId === device.roomId).length;
    }
    return project.devices.filter(
      (d) => d.ruleCode === device.ruleCode && d.roomId === device.roomId && !d.trace.notes.includes("CHILD_TRACK") && !d.trace.notes.includes("SHARED_TRACK")
    ).length;
  }
  function quantityText(rule, device, project, execution) {
    const total = countSameRule(device, project);
    const placed = execution?.placedCount ?? total;
    const derived = project.devices.filter(
      (d) => d.ruleCode === device.ruleCode && d.roomId === device.roomId && (d.trace.notes.includes("CHILD_TRACK") || d.trace.notes.includes("SHARED_TRACK"))
    ).length;
    const derivedText = derived ? `\uFF0C\u53E6\u542B ${derived} \u6761\u884D\u751F\u8F68\u9053` : "";
    const widthLabel = rule.quantity.kind === "measuredLength" ? "\u5B9E\u6D4B" : "\u793A\u610F";
    const width = device.size.width > 200 ? `\uFF0C\u5F53\u524D${widthLabel}\u957F\u5EA6 ${Math.round(device.size.width)}mm` : "";
    return `\u672C\u89C4\u5219\u843D\u4F4D ${placed} \u53F0${derivedText}${width}`;
  }
  function anchorText(rule, device) {
    const kind = ANCHOR_LABELS[rule.anchor.kind] ?? rule.anchor.kind;
    const label = rule.anchor.raw || kind;
    const raw = rule.anchor.raw && rule.anchor.raw !== rule.anchor.kind ? `\uFF08\u7ED3\u6784\u951A\u70B9\uFF1A${kind}\uFF09` : "";
    const actual = device.trace.anchor !== rule.anchor.kind ? `\uFF0C\u5B9E\u9645\u843D\u70B9\u4E3A ${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}` : "";
    return `${label}${raw}${actual}`;
  }
  function explainDevice(device, project, layout) {
    const room = project.rooms.find((r) => r.id === device.roomId);
    const rule = allRules().find((r) => r.pointCode === device.ruleCode) ?? (room ? crossRuleForCode(device.ruleCode, room.spaceCode) : null);
    const execution = layout?.executions.find((e) => e.ruleCode === device.ruleCode && e.roomId === device.roomId);
    const candidateRules = room ? rulesForDevice(room.spaceCode, device.deviceKey) : [];
    const warnings = [
      ...device.trace.warnings,
      ...device.trace.notes.filter((n) => ["NO_FURNITURE", "NO_TARGET", "SPACING_CONFLICT", "NO_AVAILABLE_CANDIDATE", "CONFLICT_P0"].includes(n)).map((n) => NOTE_LABELS[n] ?? n)
    ];
    if (device.source === "wholeHouse" || device.ruleCode === "WHOLE-HOUSE") {
      return {
        kind: "wholeHouse",
        kindLabel: "\u5168\u5C4B\u7EA7",
        code: device.ruleCode,
        title: device.deviceType2,
        subtitle: "\u5168\u5C4B\u57FA\u7840\u5305 \xB7 \u4E0D\u8FDB\u5165\u7A7A\u95F4\u6A21\u677F",
        rows: [
          { label: "\u8BBE\u5907\u7C7B\u578B", value: `${device.category1} / ${device.deviceType2}` },
          { label: "\u5BBF\u4E3B\u7A7A\u95F4", value: device.roomName },
          { label: "\u5B89\u88C5\u4F4D\u7F6E", value: `x ${device.position.x} \xB7 y ${device.position.y} \xB7 z ${device.position.z}mm` }
        ],
        why: [
          "\u8BE5\u8BBE\u5907\u5C5E\u4E8E\u5168\u5C4B\u7EA7\u57FA\u7840\u8BBE\u65BD\uFF0C\u4E0D\u6309\u5355\u4E2A\u7A7A\u95F4\u6A21\u677F\u5E03\u70B9\u3002",
          `\u6309\u5168\u5C4B\u57FA\u7840\u5305\u653E\u5728\u300C${device.roomName}\u300D\uFF0C\u4E0E\u7A7A\u95F4\u70B9\u4F4D\u89C4\u5219\u5206\u5F00\u7EDF\u8BA1\u3002`,
          "\u540C\u4E00\u5168\u5C4B\u8BBE\u5907\u53EA\u51FA\u73B0\u4E00\u6B21\uFF0C\u4E0D\u4F1A\u56E0\u7A7A\u95F4\u6570\u91CF\u589E\u52A0\u800C\u91CD\u590D\u3002"
        ],
        warnings,
        rule: null,
        candidateRules: [],
        executionReason: execution?.reason
      };
    }
    if (device.ruleCode === "MANUAL" || device.ruleCode === "DEMO-COMBO") {
      const isDemo = device.ruleCode === "DEMO-COMBO";
      return {
        kind: isDemo ? "demo" : "manual",
        kindLabel: isDemo ? "Demo \u706F\u6548" : "\u672A\u5E03\u70B9",
        code: device.ruleCode,
        title: device.deviceType2,
        subtitle: isDemo ? "\u7528\u4E8E\u6F14\u793A\u8BBE\u5907\u7C7B\u578B\u5BF9\u5E94\u7684 2D / 3D \u56FE\u5F62" : "\u624B\u52A8\u62D6\u5165\uFF0C\u5C1A\u672A\u6267\u884C\u89C4\u5219\u5339\u914D",
        rows: [
          { label: "\u8BBE\u5907\u7C7B\u578B", value: `${device.category1} / ${device.deviceType2}` },
          { label: "\u6240\u5728\u7A7A\u95F4", value: spaceName(device, project) },
          { label: "\u5B89\u88C5\u4F4D\u7F6E", value: `x ${device.position.x} \xB7 y ${device.position.y} \xB7 z ${device.position.z}mm` },
          { label: "\u53EF\u547D\u4E2D\u89C4\u5219", value: candidateRules.length ? `${candidateRules.length} \u6761` : "\u65E0\u4E13\u7528\u89C4\u5219" }
        ],
        why: isDemo ? [
          "\u8FD9\u662F Demo \u7EC4\u5408\u706F\u6548\u8BBE\u5907\uFF0C\u7528\u6765\u9A8C\u8BC1\u53E3\u5B57 / L \u578B / U \u578B\u706F\u5E26\u7B49\u56FE\u5F62\u793A\u610F\u3002",
          "\u5B83\u4E0D\u53C2\u4E0E 183 \u6761\u89C4\u5219\u5339\u914D\uFF0C\u4E5F\u4E0D\u4F1A\u8BA1\u5165\u89C4\u5219\u547D\u4E2D\u7EDF\u8BA1\u3002"
        ] : [
          "\u8FD9\u662F\u624B\u52A8\u62D6\u5165\u7684\u8BBE\u5907\uFF0C\u5F53\u524D\u8FD8\u6CA1\u6709\u6267\u884C\u89C4\u5219\u5339\u914D\uFF0C\u6240\u4EE5\u4E0D\u4F1A\u663E\u793A\u89C4\u5219\u7F16\u53F7\u3002",
          candidateRules.length ? `\u5F53\u524D\u7A7A\u95F4\u6709 ${candidateRules.length} \u6761\u89C4\u5219\u53EF\u80FD\u547D\u4E2D\u8BE5\u8BBE\u5907\uFF1A${candidateRules.map((r) => r.pointCode).join("\u3001")}\u3002` : "\u5F53\u524D\u7A7A\u95F4\u7684 183 \u6761\u89C4\u5219\u91CC\u6CA1\u6709\u4E3A\u8BE5\u8BBE\u5907\u914D\u7F6E\u4E13\u7528\u89C4\u5219\uFF0C\u4E00\u952E\u5E03\u70B9\u65F6\u5C06\u8D70\u901A\u7528\u5E03\u70B9\u7B56\u7565\u3002",
          "\u70B9\u9876\u90E8\u300C\u4E00\u952E\u5E03\u70B9\u300D\u540E\uFF0C\u4F1A\u6309\u540C\u7A7A\u95F4\u3001\u540C\u8BBE\u5907\u7684\u89C4\u5219\u91CD\u65B0\u8BA1\u7B97\u4F4D\u7F6E\uFF0C\u5E76\u628A\u547D\u4E2D\u7ED3\u679C\u663E\u793A\u5728\u8FD9\u91CC\u3002"
        ],
        warnings,
        rule: null,
        candidateRules,
        executionReason: execution?.reason
      };
    }
    if (!rule) {
      const genericReason = [...GENERIC_ANCHOR_REASON].find((x) => x.test(device))?.text ?? "\u6309\u623F\u95F4\u51E0\u4F55\u53D6\u70B9";
      return {
        kind: "generic",
        kindLabel: "\u901A\u7528\u5E03\u70B9",
        code: device.ruleCode,
        title: device.deviceType2,
        subtitle: `\u672A\u547D\u4E2D\u4E13\u7528\u89C4\u5219\uFF0C\u6309\u300C${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}\u300D\u901A\u7528\u7B56\u7565\u653E\u7F6E`,
        rows: [
          { label: "\u8BBE\u5907\u7C7B\u578B", value: `${device.category1} / ${device.deviceType2}` },
          { label: "\u6240\u5728\u7A7A\u95F4", value: spaceName(device, project) },
          { label: "\u5B9E\u9645\u951A\u70B9", value: ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor },
          { label: "\u7F6E\u4FE1\u5EA6", value: String(device.trace.confidence) },
          { label: "\u89C4\u5219\u6765\u6E90", value: device.ruleCode === "EXISTING" ? "\u8BBE\u5907\u76EE\u5F55\u672A\u5339\u914D" : "\u73B0\u6709\u8BBE\u5907\u901A\u7528\u5E03\u70B9" }
        ],
        why: [
          `\u5F53\u524D\u7A7A\u95F4\u7684 183 \u6761\u89C4\u5219\u91CC\u6CA1\u6709\u4E3A\u300C${device.deviceType2}\u300D\u914D\u7F6E\u4E13\u7528\u89C4\u5219\uFF0C\u56E0\u6B64\u8D70\u4E86\u901A\u7528\u5E03\u70B9\u3002`,
          `\u901A\u7528\u7B56\u7565\uFF1A${genericReason}\u3002`,
          `\u5B9E\u9645\u951A\u70B9\u4E3A${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}\uFF0C\u7F6E\u4FE1\u5EA6 ${device.trace.confidence}\uFF1B\u8FD9\u662F\u515C\u5E95\u7ED3\u679C\uFF0C\u4E0D\u662F\u89C4\u5219\u547D\u4E2D\u3002`,
          candidateRules.length ? `\u540C\u7A7A\u95F4\u53EF\u547D\u4E2D\u7684\u89C4\u5219\u6709\uFF1A${candidateRules.map((r) => r.pointCode).join("\u3001")}\u3002` : "\u5982\u9700\u4E25\u683C\u6309\u89C4\u5219\u5E03\u7F6E\uFF0C\u8BF7\u4F7F\u7528\u300C\u4E00\u952E\u5957\u9910\u300D\u751F\u6210\u8BE5\u7A7A\u95F4\u7684\u6807\u51C6\u8BBE\u5907\u3002"
        ],
        warnings,
        rule: null,
        candidateRules,
        executionReason: execution?.reason
      };
    }
    const isGeneric = rule.pointCode === "EXISTING-GENERIC" || device.trace.notes.includes("NO_RULE_FALLBACK");
    const priority = PRIORITY_LABELS[rule.priority];
    const mount = MOUNT_LABELS2[rule.mount];
    const statusText = device.status === "pending" ? "\u5F85\u5904\u7406\uFF08\u672A\u786E\u8BA4\u843D\u4F4D\uFF09" : device.status === "fallback" ? "\u964D\u7EA7\u843D\u4F4D" : device.status === "adjusted" ? "\u4EBA\u5DE5\u8C03\u6574\uFF08\u4FDD\u7559\u89C4\u5219\u5F52\u56E0\uFF09" : device.status === "manual" ? "\u624B\u52A8" : "\u6B63\u5E38\u843D\u4F4D";
    const lighting = device.lighting;
    const circuitText = lighting?.circuitId ? `${lighting.circuitId}${lighting.gatewayId ? ` \xB7 ${lighting.gatewayId}` : ""}${lighting.daliAddress != null ? ` \xB7 DALI ${lighting.daliAddress}` : ""} \xB7 ${lighting.dimmingProtocol || "\u2014"}\uFF08\u6A21\u62DF\uFF09` : "\u672A\u5206\u914D";
    const photometryText = lighting?.photometryStatus === "not_applicable" ? "\u4E0D\u9002\u7528\uFF08\u88AB\u52A8\u8F7D\u4F53\uFF09" : lighting?.iesFile ? `${lighting.iesFile}\uFF08\u5408\u6210\uFF09` : "\u7F3A\u5931";
    const lightingRows = lighting ? [
      { label: "\u7167\u660E\u5C42\u7EA7", value: { base: "\u57FA\u7840\u7167\u660E", task: "\u4EFB\u52A1\u7167\u660E", accent: "\u91CD\u70B9\u7167\u660E" }[lighting.layer] },
      { label: "\u63A7\u5236\u7EC4", value: lighting.groupLabel },
      { label: "\u8272\u6E29 / \u5149\u675F", value: `${lighting.cct}K / ${lighting.beam}\xB0` },
      { label: "\u529F\u7387 / \u5149\u901A\u91CF", value: `${lighting.watt}W / ${lighting.lumen ?? "\u2014"}lm\uFF08\u6A21\u62DF\uFF09` },
      { label: "\u4EA7\u54C1\u578B\u53F7", value: `${lighting.productId}${lighting.productName ? ` \xB7 ${lighting.productName}` : ""}` },
      { label: "\u4EA7\u54C1\u72B6\u6001", value: lighting.productStatus === "selected" ? "\u771F\u5B9E\u9009\u54C1" : lighting.photometryStatus === "not_applicable" ? "\u88AB\u52A8\u8F7D\u4F53\uFF08\u65E0\u72EC\u7ACB\u914D\u5149\uFF09" : lighting.photometryStatus === "synthetic" ? "\u6A21\u62DF\u9009\u54C1\uFF08\u5408\u6210 IES\uFF0C\u975E\u5B9E\u6D4B\uFF09" : "\u89C4\u683C\u610F\u5411\uFF08\u7F3A IES\uFF09" },
      { label: "IES / LDT", value: photometryText },
      { label: "\u56DE\u8DEF / \u8C03\u5149", value: circuitText },
      { label: "UGR / Ra", value: `${lighting.ugr ?? "\u2014"} / ${lighting.cri ?? "\u2014"}\uFF08\u6A21\u62DF\u503C\uFF0C\u672A\u9A8C\u8BC1\uFF09` }
    ] : [];
    const rows = [
      { label: "\u89C4\u5219\u7F16\u53F7", value: rule.pointCode },
      { label: "\u8BBE\u5907\u7C7B\u578B", value: `${device.category1} / ${device.deviceType2}` },
      { label: "\u7528\u9014", value: rule.usage || "\u57FA\u7840\u5E03\u70B9" },
      ...lightingRows,
      { label: "\u6570\u91CF\u516C\u5F0F", value: `${rule.quantity.raw} \u2192 ${quantityText(rule, device, project, execution)}` },
      ...["rect", "l", "u"].includes(device.visual) ? [{ label: "\u5C3A\u5BF8\u4F9D\u636E", value: "\u6309\u7A7A\u95F4\u53EF\u7528\u9762\u79EF\u52A8\u6001\u8BA1\u7B97" }] : [],
      { label: "\u951A\u70B9", value: anchorText(rule, device) },
      { label: "\u5B89\u88C5\u9762 / \u9AD8\u5EA6", value: `${mount} \xB7 ${device.position.z}mm` },
      { label: "\u6700\u5C0F\u95F4\u8DDD", value: rule.spacing ? `${rule.spacing}mm` : "\u672A\u9650\u5236" },
      { label: "\u4F18\u5148\u7EA7", value: `${rule.priority} \xB7 ${priority}` },
      { label: "\u6267\u884C\u72B6\u6001", value: statusText }
    ];
    if (device.status === "pending" && device.trace.pending) {
      rows.push(
        { label: "\u672A\u6EE1\u8DB3\u6761\u4EF6", value: device.trace.pending.unmet },
        { label: "\u5904\u7406\u5EFA\u8BAE", value: device.trace.pending.suggestion }
      );
    }
    const pending = device.status === "pending" ? device.trace.pending : void 0;
    const pendingWhy = pending ? [
      `\u5F85\u5904\u7406\u539F\u56E0\uFF1A${pending.unmet}\u3002`,
      `\u89C4\u5219\u8981\u6C42\uFF1A${pending.requirement}\u3002`,
      `\u68C0\u67E5\u7ED3\u679C\uFF1A${pending.found}\u3002`,
      `\u5904\u7406\u5EFA\u8BAE\uFF1A${pending.suggestion}\u3002`
    ] : [];
    const lightingWhy = lighting ? [`\u7167\u660E\u5206\u7EC4\uFF1A${lighting.groupLabel}\uFF1B${{ base: "\u57FA\u7840\u7167\u660E", task: "\u4EFB\u52A1\u7167\u660E", accent: "\u91CD\u70B9\u7167\u660E" }[lighting.layer]} \xB7 ${lighting.cct}K \xB7 ${lighting.beam}\xB0 \xB7 ${lighting.watt}W / ${lighting.lumen ?? "\u2014"}lm\uFF1B\u578B\u53F7 ${lighting.productId}\uFF1B${lighting.photometryStatus === "not_applicable" ? "\u88AB\u52A8\u8F7D\u4F53" : lighting.photometryStatus === "synthetic" ? "\u6A21\u62DF\u9009\u54C1/\u5408\u6210 IES\uFF08\u975E\u5B9E\u6D4B\uFF09" : "\u89C4\u683C\u610F\u5411"}\uFF1B${circuitText}\uFF1BUGR ${lighting.ugr ?? "\u2014"} / Ra ${lighting.cri ?? "\u2014"}\uFF08\u6A21\u62DF\uFF09\u3002`] : [];
    const why = [
      ...lightingWhy,
      ...pendingWhy,
      ...isGeneric ? [
        `\u5F53\u524D\u7A7A\u95F4\u6CA1\u6709\u4E3A\u300C${device.deviceType2}\u300D\u914D\u7F6E\u4E13\u7528\u89C4\u5219\uFF0C\u56E0\u6B64\u8D70\u4E86\u901A\u7528\u5E03\u70B9\uFF08${rule.pointCode}\uFF09\u3002`,
        `\u901A\u7528\u7B56\u7565\uFF1A${[...GENERIC_ANCHOR_REASON].find((x) => x.test(device))?.text ?? "\u6309\u623F\u95F4\u51E0\u4F55\u53D6\u70B9"}\u3002`,
        `\u5B9E\u9645\u951A\u70B9\u4E3A${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}\uFF0C\u7F6E\u4FE1\u5EA6 ${device.trace.confidence}\uFF0C\u8FD9\u662F\u515C\u5E95\u7ED3\u679C\u800C\u975E\u89C4\u5219\u547D\u4E2D\u3002`
      ] : [
        `\u547D\u4E2D ${rule.pointCode}\u300C${rule.deviceType2}\u300D\u89C4\u5219\uFF0C\u8D1F\u8D23\u300C${rule.usage || "\u57FA\u7840\u5E03\u70B9"}\u300D\u3002`,
        `\u6570\u91CF\uFF1A\u89C4\u5219\u8981\u6C42 ${rule.quantity.raw}\uFF0C${quantityText(rule, device, project, execution)}\u3002`,
        `\u4F4D\u7F6E\uFF1A\u89C4\u5219\u8981\u6C42${rule.anchor.raw || ANCHOR_LABELS[rule.anchor.kind] || rule.anchor.kind}\uFF0C\u53D6\u7B2C ${device.trace.candidateRank || 1} \u4E2A\u5019\u9009\u70B9\uFF08\u7F6E\u4FE1\u5EA6 ${device.trace.confidence}\uFF09\u3002`,
        `\u9AD8\u5EA6\uFF1A${mount}\uFF0C\u843D\u5728 ${device.position.z}mm\u3002`,
        `\u4F18\u5148\u7EA7 ${rule.priority}\uFF08${priority}\uFF09\u51B3\u5B9A\u51B2\u7A81\u65F6\u7684\u5360\u4F4D\u987A\u5E8F\u3002`
      ]
    ];
    if (rule.quantity.kind === "measuredLength") {
      why.push("\u8BE5\u89C4\u5219\u957F\u5EA6\u6309\u5E03\u7F6E\u540E\u5B9E\u6D4B\uFF0C\u5F53\u524D\u6309\u5B9E\u9645\u53EF\u5E03\u8DEF\u5F84\u6536\u53E3\uFF0C\u4E0D\u4F1A\u8DE8\u8D8A\u5899\u4F53\u8FDB\u5165\u76F8\u90BB\u7A7A\u95F4\u3002");
    }
    if (device.status === "pending") {
      if (!pending) {
        why.push("\u5F53\u524D\u8BBE\u5907\u4ECD\u4FDD\u7559\u5728\u62A5\u4EF7\u6570\u91CF\u4E2D\uFF0C\u4F46\u6CA1\u6709\u5408\u6CD5\u5019\u9009\u70B9\u6216\u7F3A\u5C11\u5B89\u88C5\u8F7D\u4F53\uFF0C\u4E0D\u80FD\u81EA\u52A8\u79FB\u52A8\u5230\u623F\u95F4\u4E2D\u5FC3\u3002");
        why.push(`\u5F85\u5904\u7406\u539F\u56E0\uFF1A${device.trace.warnings.join("\uFF1B") || "\u5019\u9009\u70B9\u4E0D\u8DB3"}`);
      }
    }
    if (["rect", "l", "u"].includes(device.visual)) {
      why.push(`\u706F\u7EC4\u5C3A\u5BF8\u6309\u7A7A\u95F4\u53EF\u7528\u9762\u79EF\u52A8\u6001\u8BA1\u7B97\uFF0C\u5F53\u524D\u4E3A ${device.size.width} \xD7 ${device.size.depth}mm\u3002`);
    }
    if (device.status === "fallback" || device.trace.fallbackStep > 0) {
      why.push(`\u6267\u884C\u65F6\u53D1\u751F\u964D\u7EA7\uFF1A${reasonText(execution?.reason) || "\u5019\u9009\u70B9\u4E0D\u8DB3\uFF0C\u5DF2\u6309\u89C4\u5219\u964D\u7EA7\u94FE\u5904\u7406"}\u3002`);
    } else if (execution?.reason) {
      why.push(`\u6267\u884C\u8BB0\u5F55\uFF1A${reasonText(execution.reason)}\u3002`);
    }
    if (rule.traceFlags.includes("DEMO_DEFAULT")) {
      why.push("\u8BE5\u89C4\u5219\u539F\u6587\u4E3A\u53EF\u9009 / \u533A\u95F4\u53C2\u6570\uFF0C\u5F53\u524D\u91C7\u7528 Demo \u9ED8\u8BA4\u503C\uFF0C\u6700\u7EC8\u53E3\u5F84\u5F85\u4E1A\u52A1\u786E\u8BA4\u3002");
    }
    return {
      kind: isGeneric ? "generic" : "rule",
      kindLabel: isGeneric ? "\u901A\u7528\u5E03\u70B9" : "\u89C4\u5219\u547D\u4E2D",
      code: rule.pointCode,
      title: rule.deviceType2,
      subtitle: `${SPACE_BY_CODE[rule.spaceCode]?.name ?? rule.spaceName} \xB7 ${rule.usage || "\u57FA\u7840\u5E03\u70B9"}`,
      rows,
      why,
      warnings,
      rule,
      candidateRules,
      executionReason: execution?.reason
    };
  }
  return __toCommonJS(rules_entry_exports);
})();
