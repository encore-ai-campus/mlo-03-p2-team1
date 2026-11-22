import type { FacilityHubLink, RegionMeta, TransitCorridor } from '../types/dashboard';

export const SEOUL_REGIONS_META: RegionMeta[] = [
  {
    "regionCode": "1111010100",
    "regionName": "청운동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96933,
      37.58921
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1464,
    "facilityScores": {
      "subway": 71,
      "jobs": 79,
      "school": 80,
      "commercial": 79,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111010200",
    "regionName": "신교동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96791,
      37.58452
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1150,
    "facilityScores": {
      "subway": 75,
      "jobs": 81,
      "school": 82,
      "commercial": 71,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111010300",
    "regionName": "궁정동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97267,
      37.58465
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1271,
    "facilityScores": {
      "subway": 84,
      "jobs": 64,
      "school": 74,
      "commercial": 71,
      "hospital": 83
    }
  },
  {
    "regionCode": "1111010400",
    "regionName": "효자동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97194,
      37.58263
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1444,
    "facilityScores": {
      "subway": 78,
      "jobs": 87,
      "school": 74,
      "commercial": 75,
      "hospital": 89
    }
  },
  {
    "regionCode": "1111010500",
    "regionName": "창성동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97242,
      37.58055
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1467,
    "facilityScores": {
      "subway": 74,
      "jobs": 73,
      "school": 72,
      "commercial": 89,
      "hospital": 89
    }
  },
  {
    "regionCode": "1111010600",
    "regionName": "통의동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9729,
      37.57806
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1159,
    "facilityScores": {
      "subway": 74,
      "jobs": 77,
      "school": 85,
      "commercial": 86,
      "hospital": 75
    }
  },
  {
    "regionCode": "1111010700",
    "regionName": "적선동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9738,
      37.57531
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1470,
    "facilityScores": {
      "subway": 64,
      "jobs": 68,
      "school": 68,
      "commercial": 70,
      "hospital": 77
    }
  },
  {
    "regionCode": "1111010800",
    "regionName": "통인동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97022,
      37.5802
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1382,
    "facilityScores": {
      "subway": 72,
      "jobs": 70,
      "school": 79,
      "commercial": 76,
      "hospital": 66
    }
  },
  {
    "regionCode": "1111010900",
    "regionName": "누상동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96267,
      37.58041
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1151,
    "facilityScores": {
      "subway": 75,
      "jobs": 76,
      "school": 68,
      "commercial": 74,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111011000",
    "regionName": "누하동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96831,
      37.57932
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1423,
    "facilityScores": {
      "subway": 70,
      "jobs": 80,
      "school": 82,
      "commercial": 77,
      "hospital": 82
    }
  },
  {
    "regionCode": "1111011100",
    "regionName": "옥인동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96339,
      37.58356
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1478,
    "facilityScores": {
      "subway": 77,
      "jobs": 78,
      "school": 75,
      "commercial": 83,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111011200",
    "regionName": "체부동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97085,
      37.57761
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1459,
    "facilityScores": {
      "subway": 88,
      "jobs": 65,
      "school": 88,
      "commercial": 76,
      "hospital": 70
    }
  },
  {
    "regionCode": "1111011300",
    "regionName": "필운동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96814,
      37.5773
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1210,
    "facilityScores": {
      "subway": 83,
      "jobs": 65,
      "school": 80,
      "commercial": 78,
      "hospital": 76
    }
  },
  {
    "regionCode": "1111011400",
    "regionName": "내자동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97173,
      37.57539
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1207,
    "facilityScores": {
      "subway": 63,
      "jobs": 74,
      "school": 64,
      "commercial": 79,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111011500",
    "regionName": "사직동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96594,
      37.57542
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1401,
    "facilityScores": {
      "subway": 88,
      "jobs": 68,
      "school": 70,
      "commercial": 80,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111011600",
    "regionName": "도렴동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97477,
      37.57308
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1334,
    "facilityScores": {
      "subway": 74,
      "jobs": 68,
      "school": 79,
      "commercial": 67,
      "hospital": 69
    }
  },
  {
    "regionCode": "1111011700",
    "regionName": "당주동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97397,
      37.57162
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1363,
    "facilityScores": {
      "subway": 76,
      "jobs": 80,
      "school": 88,
      "commercial": 87,
      "hospital": 75
    }
  },
  {
    "regionCode": "1111011800",
    "regionName": "내수동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97194,
      37.57333
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1153,
    "facilityScores": {
      "subway": 84,
      "jobs": 69,
      "school": 82,
      "commercial": 86,
      "hospital": 83
    }
  },
  {
    "regionCode": "1111011900",
    "regionName": "세종로",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97678,
      37.58029
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1116,
    "facilityScores": {
      "subway": 67,
      "jobs": 76,
      "school": 69,
      "commercial": 67,
      "hospital": 75
    }
  },
  {
    "regionCode": "1111012000",
    "regionName": "신문로1가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97396,
      37.5702
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1139,
    "facilityScores": {
      "subway": 80,
      "jobs": 82,
      "school": 66,
      "commercial": 70,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111012100",
    "regionName": "신문로2가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96921,
      37.57087
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1368,
    "facilityScores": {
      "subway": 66,
      "jobs": 71,
      "school": 89,
      "commercial": 68,
      "hospital": 76
    }
  },
  {
    "regionCode": "1111012200",
    "regionName": "청진동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98017,
      37.57145
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1144,
    "facilityScores": {
      "subway": 83,
      "jobs": 80,
      "school": 83,
      "commercial": 79,
      "hospital": 73
    }
  },
  {
    "regionCode": "1111012300",
    "regionName": "서린동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98046,
      37.56956
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1125,
    "facilityScores": {
      "subway": 69,
      "jobs": 63,
      "school": 64,
      "commercial": 82,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111012400",
    "regionName": "수송동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98063,
      37.57369
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1322,
    "facilityScores": {
      "subway": 87,
      "jobs": 74,
      "school": 69,
      "commercial": 77,
      "hospital": 89
    }
  },
  {
    "regionCode": "1111012500",
    "regionName": "중학동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97973,
      37.57532
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1429,
    "facilityScores": {
      "subway": 85,
      "jobs": 79,
      "school": 67,
      "commercial": 76,
      "hospital": 81
    }
  },
  {
    "regionCode": "1111012600",
    "regionName": "종로1가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.97976,
      37.57041
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1370,
    "facilityScores": {
      "subway": 63,
      "jobs": 76,
      "school": 70,
      "commercial": 65,
      "hospital": 79
    }
  },
  {
    "regionCode": "1111012700",
    "regionName": "공평동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98317,
      37.5713
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1201,
    "facilityScores": {
      "subway": 85,
      "jobs": 71,
      "school": 70,
      "commercial": 74,
      "hospital": 79
    }
  },
  {
    "regionCode": "1111012800",
    "regionName": "관훈동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9847,
      37.57416
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1461,
    "facilityScores": {
      "subway": 66,
      "jobs": 68,
      "school": 72,
      "commercial": 78,
      "hospital": 79
    }
  },
  {
    "regionCode": "1111012900",
    "regionName": "견지동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98302,
      37.57356
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1171,
    "facilityScores": {
      "subway": 70,
      "jobs": 69,
      "school": 67,
      "commercial": 87,
      "hospital": 63
    }
  },
  {
    "regionCode": "1111013000",
    "regionName": "와룡동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99259,
      37.58173
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1223,
    "facilityScores": {
      "subway": 82,
      "jobs": 81,
      "school": 85,
      "commercial": 68,
      "hospital": 69
    }
  },
  {
    "regionCode": "1111013100",
    "regionName": "권농동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99165,
      37.57647
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1491,
    "facilityScores": {
      "subway": 86,
      "jobs": 89,
      "school": 64,
      "commercial": 82,
      "hospital": 66
    }
  },
  {
    "regionCode": "1111013200",
    "regionName": "운니동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98829,
      37.57634
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1286,
    "facilityScores": {
      "subway": 64,
      "jobs": 88,
      "school": 87,
      "commercial": 79,
      "hospital": 75
    }
  },
  {
    "regionCode": "1111013300",
    "regionName": "익선동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98973,
      37.57437
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1400,
    "facilityScores": {
      "subway": 83,
      "jobs": 76,
      "school": 81,
      "commercial": 71,
      "hospital": 67
    }
  },
  {
    "regionCode": "1111013400",
    "regionName": "경운동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98644,
      37.57519
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1288,
    "facilityScores": {
      "subway": 64,
      "jobs": 69,
      "school": 69,
      "commercial": 65,
      "hospital": 88
    }
  },
  {
    "regionCode": "1111013500",
    "regionName": "관철동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98603,
      37.56913
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1380,
    "facilityScores": {
      "subway": 71,
      "jobs": 87,
      "school": 75,
      "commercial": 87,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111013600",
    "regionName": "인사동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9861,
      37.57175
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1183,
    "facilityScores": {
      "subway": 78,
      "jobs": 87,
      "school": 84,
      "commercial": 70,
      "hospital": 82
    }
  },
  {
    "regionCode": "1111013700",
    "regionName": "낙원동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98863,
      37.57257
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1216,
    "facilityScores": {
      "subway": 87,
      "jobs": 68,
      "school": 73,
      "commercial": 73,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111013800",
    "regionName": "종로2가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9869,
      37.57044
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1403,
    "facilityScores": {
      "subway": 79,
      "jobs": 85,
      "school": 64,
      "commercial": 67,
      "hospital": 64
    }
  },
  {
    "regionCode": "1111013900",
    "regionName": "팔판동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98072,
      37.58283
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1135,
    "facilityScores": {
      "subway": 83,
      "jobs": 74,
      "school": 65,
      "commercial": 72,
      "hospital": 74
    }
  },
  {
    "regionCode": "1111014000",
    "regionName": "삼청동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98099,
      37.59077
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1333,
    "facilityScores": {
      "subway": 87,
      "jobs": 75,
      "school": 74,
      "commercial": 68,
      "hospital": 77
    }
  },
  {
    "regionCode": "1111014100",
    "regionName": "안국동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98362,
      37.5774
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1168,
    "facilityScores": {
      "subway": 66,
      "jobs": 65,
      "school": 68,
      "commercial": 74,
      "hospital": 79
    }
  },
  {
    "regionCode": "1111014200",
    "regionName": "소격동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98099,
      37.57962
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1230,
    "facilityScores": {
      "subway": 65,
      "jobs": 71,
      "school": 71,
      "commercial": 77,
      "hospital": 73
    }
  },
  {
    "regionCode": "1111014300",
    "regionName": "화동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98273,
      37.58068
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1056,
    "facilityScores": {
      "subway": 85,
      "jobs": 75,
      "school": 70,
      "commercial": 74,
      "hospital": 66
    }
  },
  {
    "regionCode": "1111014400",
    "regionName": "사간동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98036,
      37.57726
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1312,
    "facilityScores": {
      "subway": 65,
      "jobs": 80,
      "school": 73,
      "commercial": 65,
      "hospital": 70
    }
  },
  {
    "regionCode": "1111014500",
    "regionName": "송현동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98187,
      37.57677
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1375,
    "facilityScores": {
      "subway": 72,
      "jobs": 72,
      "school": 73,
      "commercial": 75,
      "hospital": 80
    }
  },
  {
    "regionCode": "1111014600",
    "regionName": "가회동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98485,
      37.58275
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1066,
    "facilityScores": {
      "subway": 73,
      "jobs": 85,
      "school": 68,
      "commercial": 70,
      "hospital": 74
    }
  },
  {
    "regionCode": "1111014700",
    "regionName": "재동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98526,
      37.5783
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1181,
    "facilityScores": {
      "subway": 83,
      "jobs": 77,
      "school": 73,
      "commercial": 73,
      "hospital": 79
    }
  },
  {
    "regionCode": "1111014800",
    "regionName": "계동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98694,
      37.58228
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1466,
    "facilityScores": {
      "subway": 63,
      "jobs": 66,
      "school": 83,
      "commercial": 69,
      "hospital": 79
    }
  },
  {
    "regionCode": "1111014900",
    "regionName": "원서동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.98826,
      37.58394
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1314,
    "facilityScores": {
      "subway": 83,
      "jobs": 81,
      "school": 63,
      "commercial": 87,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111015000",
    "regionName": "훈정동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99419,
      37.57441
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1392,
    "facilityScores": {
      "subway": 81,
      "jobs": 72,
      "school": 76,
      "commercial": 63,
      "hospital": 69
    }
  },
  {
    "regionCode": "1111015100",
    "regionName": "묘동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99178,
      37.57241
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1400,
    "facilityScores": {
      "subway": 81,
      "jobs": 87,
      "school": 86,
      "commercial": 87,
      "hospital": 75
    }
  },
  {
    "regionCode": "1111015200",
    "regionName": "봉익동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99301,
      37.57225
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1367,
    "facilityScores": {
      "subway": 71,
      "jobs": 72,
      "school": 88,
      "commercial": 88,
      "hospital": 70
    }
  },
  {
    "regionCode": "1111015300",
    "regionName": "돈의동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99072,
      37.57197
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1145,
    "facilityScores": {
      "subway": 74,
      "jobs": 73,
      "school": 87,
      "commercial": 67,
      "hospital": 87
    }
  },
  {
    "regionCode": "1111015400",
    "regionName": "장사동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99402,
      37.56924
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1361,
    "facilityScores": {
      "subway": 70,
      "jobs": 64,
      "school": 82,
      "commercial": 82,
      "hospital": 79
    }
  },
  {
    "regionCode": "1111015500",
    "regionName": "관수동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99047,
      37.56908
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1386,
    "facilityScores": {
      "subway": 67,
      "jobs": 79,
      "school": 72,
      "commercial": 70,
      "hospital": 82
    }
  },
  {
    "regionCode": "1111015600",
    "regionName": "종로3가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99232,
      37.57038
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1286,
    "facilityScores": {
      "subway": 73,
      "jobs": 71,
      "school": 82,
      "commercial": 84,
      "hospital": 77
    }
  },
  {
    "regionCode": "1111015700",
    "regionName": "인의동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99766,
      37.57232
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1445,
    "facilityScores": {
      "subway": 81,
      "jobs": 78,
      "school": 85,
      "commercial": 88,
      "hospital": 69
    }
  },
  {
    "regionCode": "1111015800",
    "regionName": "예지동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9983,
      37.56964
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1227,
    "facilityScores": {
      "subway": 83,
      "jobs": 73,
      "school": 87,
      "commercial": 76,
      "hospital": 80
    }
  },
  {
    "regionCode": "1111015900",
    "regionName": "원남동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99753,
      37.57557
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1117,
    "facilityScores": {
      "subway": 74,
      "jobs": 66,
      "school": 85,
      "commercial": 69,
      "hospital": 81
    }
  },
  {
    "regionCode": "1111016000",
    "regionName": "연지동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.00015,
      37.57375
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1118,
    "facilityScores": {
      "subway": 64,
      "jobs": 82,
      "school": 66,
      "commercial": 73,
      "hospital": 65
    }
  },
  {
    "regionCode": "1111016100",
    "regionName": "종로4가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99794,
      37.57066
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1124,
    "facilityScores": {
      "subway": 75,
      "jobs": 88,
      "school": 72,
      "commercial": 71,
      "hospital": 77
    }
  },
  {
    "regionCode": "1111016200",
    "regionName": "효제동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.00304,
      37.57306
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1168,
    "facilityScores": {
      "subway": 69,
      "jobs": 68,
      "school": 85,
      "commercial": 69,
      "hospital": 66
    }
  },
  {
    "regionCode": "1111016300",
    "regionName": "종로5가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.00354,
      37.57059
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1142,
    "facilityScores": {
      "subway": 67,
      "jobs": 67,
      "school": 85,
      "commercial": 83,
      "hospital": 73
    }
  },
  {
    "regionCode": "1111016400",
    "regionName": "종로6가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.00772,
      37.57195
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1236,
    "facilityScores": {
      "subway": 88,
      "jobs": 66,
      "school": 71,
      "commercial": 63,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111016500",
    "regionName": "이화동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.00567,
      37.57723
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1500,
    "facilityScores": {
      "subway": 78,
      "jobs": 68,
      "school": 74,
      "commercial": 83,
      "hospital": 78
    }
  },
  {
    "regionCode": "1111016600",
    "regionName": "연건동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99972,
      37.57865
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1050,
    "facilityScores": {
      "subway": 87,
      "jobs": 64,
      "school": 71,
      "commercial": 77,
      "hospital": 65
    }
  },
  {
    "regionCode": "1111016700",
    "regionName": "충신동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.00595,
      37.5749
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1183,
    "facilityScores": {
      "subway": 65,
      "jobs": 64,
      "school": 83,
      "commercial": 78,
      "hospital": 66
    }
  },
  {
    "regionCode": "1111016800",
    "regionName": "동숭동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.0049,
      37.58143
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1204,
    "facilityScores": {
      "subway": 88,
      "jobs": 77,
      "school": 68,
      "commercial": 87,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111016900",
    "regionName": "혜화동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.00173,
      37.58781
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1305,
    "facilityScores": {
      "subway": 68,
      "jobs": 87,
      "school": 64,
      "commercial": 88,
      "hospital": 76
    }
  },
  {
    "regionCode": "1111017000",
    "regionName": "명륜1가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99752,
      37.58906
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1394,
    "facilityScores": {
      "subway": 73,
      "jobs": 86,
      "school": 69,
      "commercial": 70,
      "hospital": 80
    }
  },
  {
    "regionCode": "1111017100",
    "regionName": "명륜2가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99903,
      37.58469
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1424,
    "facilityScores": {
      "subway": 69,
      "jobs": 67,
      "school": 73,
      "commercial": 64,
      "hospital": 69
    }
  },
  {
    "regionCode": "1111017200",
    "regionName": "명륜4가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.99989,
      37.58219
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1239,
    "facilityScores": {
      "subway": 72,
      "jobs": 71,
      "school": 67,
      "commercial": 85,
      "hospital": 78
    }
  },
  {
    "regionCode": "1111017300",
    "regionName": "명륜3가",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9931,
      37.58825
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1074,
    "facilityScores": {
      "subway": 64,
      "jobs": 72,
      "school": 66,
      "commercial": 87,
      "hospital": 85
    }
  },
  {
    "regionCode": "1111017400",
    "regionName": "창신동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.01245,
      37.57541
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1103,
    "facilityScores": {
      "subway": 81,
      "jobs": 71,
      "school": 74,
      "commercial": 70,
      "hospital": 67
    }
  },
  {
    "regionCode": "1111017500",
    "regionName": "숭인동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      127.01897,
      37.57555
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1199,
    "facilityScores": {
      "subway": 73,
      "jobs": 82,
      "school": 77,
      "commercial": 88,
      "hospital": 71
    }
  },
  {
    "regionCode": "1111017600",
    "regionName": "교남동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96444,
      37.56852
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1087,
    "facilityScores": {
      "subway": 71,
      "jobs": 69,
      "school": 70,
      "commercial": 79,
      "hospital": 84
    }
  },
  {
    "regionCode": "1111017700",
    "regionName": "평동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96686,
      37.56792
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1378,
    "facilityScores": {
      "subway": 80,
      "jobs": 64,
      "school": 84,
      "commercial": 80,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111017800",
    "regionName": "송월동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96524,
      37.57007
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1367,
    "facilityScores": {
      "subway": 68,
      "jobs": 86,
      "school": 85,
      "commercial": 70,
      "hospital": 80
    }
  },
  {
    "regionCode": "1111017900",
    "regionName": "홍파동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96401,
      37.57114
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1316,
    "facilityScores": {
      "subway": 72,
      "jobs": 73,
      "school": 80,
      "commercial": 72,
      "hospital": 81
    }
  },
  {
    "regionCode": "1111018000",
    "regionName": "교북동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96145,
      37.57157
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1226,
    "facilityScores": {
      "subway": 77,
      "jobs": 77,
      "school": 77,
      "commercial": 87,
      "hospital": 88
    }
  },
  {
    "regionCode": "1111018100",
    "regionName": "행촌동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96264,
      37.57363
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1137,
    "facilityScores": {
      "subway": 87,
      "jobs": 89,
      "school": 82,
      "commercial": 69,
      "hospital": 82
    }
  },
  {
    "regionCode": "1111018200",
    "regionName": "구기동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9593,
      37.61939
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1211,
    "facilityScores": {
      "subway": 72,
      "jobs": 72,
      "school": 75,
      "commercial": 70,
      "hospital": 86
    }
  },
  {
    "regionCode": "1111018300",
    "regionName": "평창동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9745,
      37.61304
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1495,
    "facilityScores": {
      "subway": 83,
      "jobs": 89,
      "school": 65,
      "commercial": 78,
      "hospital": 81
    }
  },
  {
    "regionCode": "1111018400",
    "regionName": "부암동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96559,
      37.59477
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1231,
    "facilityScores": {
      "subway": 71,
      "jobs": 81,
      "school": 63,
      "commercial": 70,
      "hospital": 68
    }
  },
  {
    "regionCode": "1111018500",
    "regionName": "홍지동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.95649,
      37.60083
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1223,
    "facilityScores": {
      "subway": 85,
      "jobs": 68,
      "school": 87,
      "commercial": 70,
      "hospital": 64
    }
  },
  {
    "regionCode": "1111018600",
    "regionName": "신영동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.96186,
      37.60254
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1058,
    "facilityScores": {
      "subway": 80,
      "jobs": 85,
      "school": 68,
      "commercial": 73,
      "hospital": 88
    }
  },
  {
    "regionCode": "1111018700",
    "regionName": "무악동",
    "sido": "서울특별시",
    "sggCode": "11110",
    "sggName": "종로구",
    "centroid": [
      126.9586,
      37.57708
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1164,
    "facilityScores": {
      "subway": 84,
      "jobs": 65,
      "school": 63,
      "commercial": 70,
      "hospital": 66
    }
  },
  {
    "regionCode": "1114010100",
    "regionName": "무교동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97905,
      37.56815
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1254,
    "facilityScores": {
      "subway": 67,
      "jobs": 78,
      "school": 83,
      "commercial": 77,
      "hospital": 68
    }
  },
  {
    "regionCode": "1114010200",
    "regionName": "다동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98119,
      37.56793
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1198,
    "facilityScores": {
      "subway": 89,
      "jobs": 82,
      "school": 80,
      "commercial": 69,
      "hospital": 81
    }
  },
  {
    "regionCode": "1114010300",
    "regionName": "태평로1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97727,
      37.56772
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1255,
    "facilityScores": {
      "subway": 64,
      "jobs": 87,
      "school": 65,
      "commercial": 70,
      "hospital": 73
    }
  },
  {
    "regionCode": "1114010400",
    "regionName": "을지로1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9806,
      37.566
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1085,
    "facilityScores": {
      "subway": 74,
      "jobs": 71,
      "school": 87,
      "commercial": 79,
      "hospital": 63
    }
  },
  {
    "regionCode": "1114010500",
    "regionName": "을지로2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98599,
      37.56591
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1170,
    "facilityScores": {
      "subway": 75,
      "jobs": 76,
      "school": 76,
      "commercial": 87,
      "hospital": 70
    }
  },
  {
    "regionCode": "1114010600",
    "regionName": "남대문로1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9829,
      37.56754
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1124,
    "facilityScores": {
      "subway": 66,
      "jobs": 82,
      "school": 84,
      "commercial": 82,
      "hospital": 81
    }
  },
  {
    "regionCode": "1114010700",
    "regionName": "삼각동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98429,
      37.56809
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1329,
    "facilityScores": {
      "subway": 79,
      "jobs": 70,
      "school": 86,
      "commercial": 81,
      "hospital": 68
    }
  },
  {
    "regionCode": "1114010800",
    "regionName": "수하동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98474,
      37.56729
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1451,
    "facilityScores": {
      "subway": 76,
      "jobs": 82,
      "school": 83,
      "commercial": 76,
      "hospital": 85
    }
  },
  {
    "regionCode": "1114010900",
    "regionName": "장교동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98697,
      37.56745
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1251,
    "facilityScores": {
      "subway": 75,
      "jobs": 83,
      "school": 89,
      "commercial": 63,
      "hospital": 68
    }
  },
  {
    "regionCode": "1114011000",
    "regionName": "수표동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98952,
      37.56749
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1091,
    "facilityScores": {
      "subway": 75,
      "jobs": 68,
      "school": 71,
      "commercial": 68,
      "hospital": 70
    }
  },
  {
    "regionCode": "1114011100",
    "regionName": "소공동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98004,
      37.56408
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1346,
    "facilityScores": {
      "subway": 83,
      "jobs": 65,
      "school": 75,
      "commercial": 81,
      "hospital": 84
    }
  },
  {
    "regionCode": "1114011200",
    "regionName": "남창동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97762,
      37.55812
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1361,
    "facilityScores": {
      "subway": 77,
      "jobs": 68,
      "school": 84,
      "commercial": 76,
      "hospital": 73
    }
  },
  {
    "regionCode": "1114011300",
    "regionName": "북창동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97821,
      37.56246
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1122,
    "facilityScores": {
      "subway": 84,
      "jobs": 84,
      "school": 86,
      "commercial": 65,
      "hospital": 65
    }
  },
  {
    "regionCode": "1114011400",
    "regionName": "태평로2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97636,
      37.56299
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1368,
    "facilityScores": {
      "subway": 67,
      "jobs": 83,
      "school": 64,
      "commercial": 80,
      "hospital": 80
    }
  },
  {
    "regionCode": "1114011500",
    "regionName": "남대문로2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.982,
      37.56392
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1064,
    "facilityScores": {
      "subway": 74,
      "jobs": 66,
      "school": 65,
      "commercial": 73,
      "hospital": 82
    }
  },
  {
    "regionCode": "1114011600",
    "regionName": "남대문로3가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97963,
      37.56175
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1069,
    "facilityScores": {
      "subway": 80,
      "jobs": 69,
      "school": 77,
      "commercial": 77,
      "hospital": 88
    }
  },
  {
    "regionCode": "1114011700",
    "regionName": "남대문로4가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97572,
      37.56061
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1359,
    "facilityScores": {
      "subway": 64,
      "jobs": 75,
      "school": 82,
      "commercial": 84,
      "hospital": 85
    }
  },
  {
    "regionCode": "1114011800",
    "regionName": "남대문로5가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97529,
      37.55609
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1399,
    "facilityScores": {
      "subway": 72,
      "jobs": 79,
      "school": 87,
      "commercial": 79,
      "hospital": 80
    }
  },
  {
    "regionCode": "1114011900",
    "regionName": "봉래동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97277,
      37.55914
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1313,
    "facilityScores": {
      "subway": 78,
      "jobs": 88,
      "school": 67,
      "commercial": 72,
      "hospital": 67
    }
  },
  {
    "regionCode": "1114012000",
    "regionName": "봉래동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97098,
      37.55658
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1168,
    "facilityScores": {
      "subway": 69,
      "jobs": 83,
      "school": 77,
      "commercial": 78,
      "hospital": 76
    }
  },
  {
    "regionCode": "1114012100",
    "regionName": "회현동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98149,
      37.55651
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1139,
    "facilityScores": {
      "subway": 78,
      "jobs": 83,
      "school": 66,
      "commercial": 77,
      "hospital": 83
    }
  },
  {
    "regionCode": "1114012200",
    "regionName": "회현동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98292,
      37.55876
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1421,
    "facilityScores": {
      "subway": 68,
      "jobs": 70,
      "school": 86,
      "commercial": 83,
      "hospital": 72
    }
  },
  {
    "regionCode": "1114012300",
    "regionName": "회현동3가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98408,
      37.56016
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1116,
    "facilityScores": {
      "subway": 72,
      "jobs": 86,
      "school": 67,
      "commercial": 82,
      "hospital": 71
    }
  },
  {
    "regionCode": "1114012400",
    "regionName": "충무로1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9825,
      37.56117
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1147,
    "facilityScores": {
      "subway": 81,
      "jobs": 71,
      "school": 71,
      "commercial": 76,
      "hospital": 68
    }
  },
  {
    "regionCode": "1114012500",
    "regionName": "충무로2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98776,
      37.56173
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1268,
    "facilityScores": {
      "subway": 84,
      "jobs": 86,
      "school": 76,
      "commercial": 88,
      "hospital": 74
    }
  },
  {
    "regionCode": "1114012600",
    "regionName": "명동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98471,
      37.56434
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1314,
    "facilityScores": {
      "subway": 65,
      "jobs": 66,
      "school": 80,
      "commercial": 78,
      "hospital": 83
    }
  },
  {
    "regionCode": "1114012700",
    "regionName": "명동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98528,
      37.56291
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1314,
    "facilityScores": {
      "subway": 88,
      "jobs": 71,
      "school": 67,
      "commercial": 88,
      "hospital": 78
    }
  },
  {
    "regionCode": "1114012800",
    "regionName": "남산동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9846,
      37.5594
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1131,
    "facilityScores": {
      "subway": 71,
      "jobs": 87,
      "school": 76,
      "commercial": 80,
      "hospital": 84
    }
  },
  {
    "regionCode": "1114012900",
    "regionName": "남산동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98578,
      37.55859
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1246,
    "facilityScores": {
      "subway": 64,
      "jobs": 69,
      "school": 79,
      "commercial": 66,
      "hospital": 79
    }
  },
  {
    "regionCode": "1114013000",
    "regionName": "남산동3가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9874,
      37.56013
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1440,
    "facilityScores": {
      "subway": 89,
      "jobs": 70,
      "school": 70,
      "commercial": 63,
      "hospital": 89
    }
  },
  {
    "regionCode": "1114013100",
    "regionName": "저동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98785,
      37.56445
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1365,
    "facilityScores": {
      "subway": 71,
      "jobs": 68,
      "school": 87,
      "commercial": 75,
      "hospital": 81
    }
  },
  {
    "regionCode": "1114013200",
    "regionName": "충무로4가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99577,
      37.56232
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1095,
    "facilityScores": {
      "subway": 72,
      "jobs": 63,
      "school": 68,
      "commercial": 77,
      "hospital": 75
    }
  },
  {
    "regionCode": "1114013300",
    "regionName": "충무로5가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99961,
      37.56283
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1258,
    "facilityScores": {
      "subway": 78,
      "jobs": 77,
      "school": 81,
      "commercial": 74,
      "hospital": 88
    }
  },
  {
    "regionCode": "1114013400",
    "regionName": "인현동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99614,
      37.5642
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1372,
    "facilityScores": {
      "subway": 64,
      "jobs": 65,
      "school": 80,
      "commercial": 75,
      "hospital": 72
    }
  },
  {
    "regionCode": "1114013500",
    "regionName": "예관동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99825,
      37.56424
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1320,
    "facilityScores": {
      "subway": 74,
      "jobs": 78,
      "school": 78,
      "commercial": 66,
      "hospital": 83
    }
  },
  {
    "regionCode": "1114013600",
    "regionName": "묵정동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00059,
      37.56136
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1408,
    "facilityScores": {
      "subway": 72,
      "jobs": 80,
      "school": 82,
      "commercial": 71,
      "hospital": 82
    }
  },
  {
    "regionCode": "1114013700",
    "regionName": "필동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99244,
      37.56111
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1068,
    "facilityScores": {
      "subway": 82,
      "jobs": 88,
      "school": 85,
      "commercial": 74,
      "hospital": 72
    }
  },
  {
    "regionCode": "1114013800",
    "regionName": "필동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9947,
      37.55879
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1413,
    "facilityScores": {
      "subway": 82,
      "jobs": 81,
      "school": 78,
      "commercial": 68,
      "hospital": 65
    }
  },
  {
    "regionCode": "1114013900",
    "regionName": "필동3가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99698,
      37.55849
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1411,
    "facilityScores": {
      "subway": 83,
      "jobs": 82,
      "school": 74,
      "commercial": 86,
      "hospital": 63
    }
  },
  {
    "regionCode": "1114014000",
    "regionName": "남학동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99083,
      37.5606
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1287,
    "facilityScores": {
      "subway": 83,
      "jobs": 68,
      "school": 84,
      "commercial": 75,
      "hospital": 83
    }
  },
  {
    "regionCode": "1114014100",
    "regionName": "주자동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98936,
      37.5607
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1337,
    "facilityScores": {
      "subway": 76,
      "jobs": 76,
      "school": 71,
      "commercial": 83,
      "hospital": 81
    }
  },
  {
    "regionCode": "1114014200",
    "regionName": "예장동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99011,
      37.55522
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1492,
    "facilityScores": {
      "subway": 85,
      "jobs": 64,
      "school": 68,
      "commercial": 73,
      "hospital": 65
    }
  },
  {
    "regionCode": "1114014300",
    "regionName": "장충동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.0076,
      37.561
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1349,
    "facilityScores": {
      "subway": 67,
      "jobs": 72,
      "school": 78,
      "commercial": 80,
      "hospital": 83
    }
  },
  {
    "regionCode": "1114014400",
    "regionName": "장충동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.0006,
      37.55501
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1183,
    "facilityScores": {
      "subway": 88,
      "jobs": 82,
      "school": 70,
      "commercial": 70,
      "hospital": 86
    }
  },
  {
    "regionCode": "1114014500",
    "regionName": "광희동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00537,
      37.56502
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1356,
    "facilityScores": {
      "subway": 72,
      "jobs": 70,
      "school": 75,
      "commercial": 76,
      "hospital": 67
    }
  },
  {
    "regionCode": "1114014600",
    "regionName": "광희동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00847,
      37.56395
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1178,
    "facilityScores": {
      "subway": 64,
      "jobs": 68,
      "school": 73,
      "commercial": 81,
      "hospital": 78
    }
  },
  {
    "regionCode": "1114014700",
    "regionName": "쌍림동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00422,
      37.56354
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1328,
    "facilityScores": {
      "subway": 64,
      "jobs": 77,
      "school": 77,
      "commercial": 80,
      "hospital": 76
    }
  },
  {
    "regionCode": "1114014800",
    "regionName": "을지로6가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00686,
      37.56777
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1281,
    "facilityScores": {
      "subway": 77,
      "jobs": 69,
      "school": 87,
      "commercial": 73,
      "hospital": 76
    }
  },
  {
    "regionCode": "1114014900",
    "regionName": "을지로7가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.0097,
      37.56629
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1059,
    "facilityScores": {
      "subway": 79,
      "jobs": 83,
      "school": 65,
      "commercial": 63,
      "hospital": 67
    }
  },
  {
    "regionCode": "1114015000",
    "regionName": "을지로4가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99773,
      37.56646
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1471,
    "facilityScores": {
      "subway": 81,
      "jobs": 88,
      "school": 76,
      "commercial": 80,
      "hospital": 78
    }
  },
  {
    "regionCode": "1114015100",
    "regionName": "을지로5가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00237,
      37.56671
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1083,
    "facilityScores": {
      "subway": 70,
      "jobs": 83,
      "school": 81,
      "commercial": 74,
      "hospital": 76
    }
  },
  {
    "regionCode": "1114015200",
    "regionName": "주교동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99942,
      37.56826
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1149,
    "facilityScores": {
      "subway": 72,
      "jobs": 66,
      "school": 67,
      "commercial": 82,
      "hospital": 70
    }
  },
  {
    "regionCode": "1114015300",
    "regionName": "방산동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00298,
      37.5687
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1087,
    "facilityScores": {
      "subway": 83,
      "jobs": 73,
      "school": 63,
      "commercial": 75,
      "hospital": 80
    }
  },
  {
    "regionCode": "1114015400",
    "regionName": "오장동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.00077,
      37.56473
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1367,
    "facilityScores": {
      "subway": 83,
      "jobs": 83,
      "school": 86,
      "commercial": 81,
      "hospital": 83
    }
  },
  {
    "regionCode": "1114015500",
    "regionName": "을지로3가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99221,
      37.56632
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1280,
    "facilityScores": {
      "subway": 63,
      "jobs": 70,
      "school": 88,
      "commercial": 84,
      "hospital": 71
    }
  },
  {
    "regionCode": "1114015600",
    "regionName": "입정동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9929,
      37.56781
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1266,
    "facilityScores": {
      "subway": 67,
      "jobs": 78,
      "school": 68,
      "commercial": 76,
      "hospital": 70
    }
  },
  {
    "regionCode": "1114015700",
    "regionName": "산림동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.9959,
      37.56764
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1083,
    "facilityScores": {
      "subway": 67,
      "jobs": 71,
      "school": 85,
      "commercial": 85,
      "hospital": 75
    }
  },
  {
    "regionCode": "1114015800",
    "regionName": "충무로3가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99178,
      37.5624
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1072,
    "facilityScores": {
      "subway": 70,
      "jobs": 71,
      "school": 88,
      "commercial": 78,
      "hospital": 81
    }
  },
  {
    "regionCode": "1114015900",
    "regionName": "초동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99222,
      37.56442
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1388,
    "facilityScores": {
      "subway": 78,
      "jobs": 79,
      "school": 79,
      "commercial": 69,
      "hospital": 63
    }
  },
  {
    "regionCode": "1114016000",
    "regionName": "인현동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.99432,
      37.56461
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1139,
    "facilityScores": {
      "subway": 64,
      "jobs": 88,
      "school": 71,
      "commercial": 76,
      "hospital": 83
    }
  },
  {
    "regionCode": "1114016100",
    "regionName": "저동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.98979,
      37.56423
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1302,
    "facilityScores": {
      "subway": 79,
      "jobs": 64,
      "school": 85,
      "commercial": 81,
      "hospital": 70
    }
  },
  {
    "regionCode": "1114016200",
    "regionName": "신당동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.01366,
      37.55791
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1174,
    "facilityScores": {
      "subway": 87,
      "jobs": 78,
      "school": 89,
      "commercial": 68,
      "hospital": 75
    }
  },
  {
    "regionCode": "1114016300",
    "regionName": "흥인동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.01638,
      37.56732
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1167,
    "facilityScores": {
      "subway": 68,
      "jobs": 69,
      "school": 73,
      "commercial": 78,
      "hospital": 82
    }
  },
  {
    "regionCode": "1114016400",
    "regionName": "무학동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.01524,
      37.56438
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1356,
    "facilityScores": {
      "subway": 72,
      "jobs": 69,
      "school": 69,
      "commercial": 68,
      "hospital": 87
    }
  },
  {
    "regionCode": "1114016500",
    "regionName": "황학동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      127.02081,
      37.56852
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1142,
    "facilityScores": {
      "subway": 85,
      "jobs": 63,
      "school": 66,
      "commercial": 65,
      "hospital": 70
    }
  },
  {
    "regionCode": "1114016600",
    "regionName": "서소문동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97391,
      37.56314
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1140,
    "facilityScores": {
      "subway": 70,
      "jobs": 65,
      "school": 73,
      "commercial": 88,
      "hospital": 89
    }
  },
  {
    "regionCode": "1114016700",
    "regionName": "정동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97314,
      37.56663
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1363,
    "facilityScores": {
      "subway": 68,
      "jobs": 75,
      "school": 71,
      "commercial": 77,
      "hospital": 65
    }
  },
  {
    "regionCode": "1114016800",
    "regionName": "순화동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.97072,
      37.56253
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1081,
    "facilityScores": {
      "subway": 64,
      "jobs": 77,
      "school": 74,
      "commercial": 65,
      "hospital": 73
    }
  },
  {
    "regionCode": "1114016900",
    "regionName": "의주로1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.96843,
      37.56411
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1216,
    "facilityScores": {
      "subway": 84,
      "jobs": 74,
      "school": 73,
      "commercial": 67,
      "hospital": 67
    }
  },
  {
    "regionCode": "1114017000",
    "regionName": "충정로1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.96832,
      37.56648
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1302,
    "facilityScores": {
      "subway": 87,
      "jobs": 78,
      "school": 84,
      "commercial": 86,
      "hospital": 86
    }
  },
  {
    "regionCode": "1114017100",
    "regionName": "중림동",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.96627,
      37.55885
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1466,
    "facilityScores": {
      "subway": 80,
      "jobs": 76,
      "school": 63,
      "commercial": 65,
      "hospital": 82
    }
  },
  {
    "regionCode": "1114017200",
    "regionName": "의주로2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.96962,
      37.56071
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1159,
    "facilityScores": {
      "subway": 71,
      "jobs": 72,
      "school": 86,
      "commercial": 63,
      "hospital": 77
    }
  },
  {
    "regionCode": "1114017300",
    "regionName": "만리동1가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.96729,
      37.55621
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1312,
    "facilityScores": {
      "subway": 74,
      "jobs": 87,
      "school": 89,
      "commercial": 81,
      "hospital": 85
    }
  },
  {
    "regionCode": "1114017400",
    "regionName": "만리동2가",
    "sido": "서울특별시",
    "sggCode": "11140",
    "sggName": "중구",
    "centroid": [
      126.96393,
      37.55462
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1222,
    "facilityScores": {
      "subway": 74,
      "jobs": 70,
      "school": 84,
      "commercial": 65,
      "hospital": 70
    }
  },
  {
    "regionCode": "1117010100",
    "regionName": "후암동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.98065,
      37.54991
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2129,
    "facilityScores": {
      "subway": 81,
      "jobs": 96,
      "school": 98,
      "commercial": 88,
      "hospital": 98
    }
  },
  {
    "regionCode": "1117010200",
    "regionName": "용산동2가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.98501,
      37.5429
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1648,
    "facilityScores": {
      "subway": 88,
      "jobs": 88,
      "school": 90,
      "commercial": 74,
      "hospital": 81
    }
  },
  {
    "regionCode": "1117010300",
    "regionName": "용산동4가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.9852,
      37.53053
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1513,
    "facilityScores": {
      "subway": 88,
      "jobs": 93,
      "school": 82,
      "commercial": 75,
      "hospital": 97
    }
  },
  {
    "regionCode": "1117010400",
    "regionName": "갈월동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.97236,
      37.54545
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1527,
    "facilityScores": {
      "subway": 87,
      "jobs": 81,
      "school": 77,
      "commercial": 99,
      "hospital": 88
    }
  },
  {
    "regionCode": "1117010500",
    "regionName": "남영동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.97337,
      37.54285
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1796,
    "facilityScores": {
      "subway": 86,
      "jobs": 89,
      "school": 97,
      "commercial": 73,
      "hospital": 75
    }
  },
  {
    "regionCode": "1117010600",
    "regionName": "용산동1가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.97703,
      37.54
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1988,
    "facilityScores": {
      "subway": 95,
      "jobs": 86,
      "school": 87,
      "commercial": 86,
      "hospital": 92
    }
  },
  {
    "regionCode": "1117010700",
    "regionName": "동자동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.97245,
      37.55205
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1456,
    "facilityScores": {
      "subway": 90,
      "jobs": 94,
      "school": 96,
      "commercial": 78,
      "hospital": 95
    }
  },
  {
    "regionCode": "1117010800",
    "regionName": "서계동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96687,
      37.55219
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1648,
    "facilityScores": {
      "subway": 73,
      "jobs": 74,
      "school": 85,
      "commercial": 97,
      "hospital": 92
    }
  },
  {
    "regionCode": "1117010900",
    "regionName": "청파동1가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96747,
      37.5488
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1760,
    "facilityScores": {
      "subway": 83,
      "jobs": 78,
      "school": 92,
      "commercial": 93,
      "hospital": 89
    }
  },
  {
    "regionCode": "1117011000",
    "regionName": "청파동2가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96626,
      37.54602
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1952,
    "facilityScores": {
      "subway": 80,
      "jobs": 73,
      "school": 88,
      "commercial": 78,
      "hospital": 74
    }
  },
  {
    "regionCode": "1117011100",
    "regionName": "청파동3가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96693,
      37.54323
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2072,
    "facilityScores": {
      "subway": 95,
      "jobs": 89,
      "school": 77,
      "commercial": 76,
      "hospital": 80
    }
  },
  {
    "regionCode": "1117011200",
    "regionName": "원효로1가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96742,
      37.53998
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2055,
    "facilityScores": {
      "subway": 89,
      "jobs": 78,
      "school": 91,
      "commercial": 89,
      "hospital": 76
    }
  },
  {
    "regionCode": "1117011300",
    "regionName": "원효로2가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.9633,
      37.53623
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1817,
    "facilityScores": {
      "subway": 85,
      "jobs": 91,
      "school": 93,
      "commercial": 89,
      "hospital": 97
    }
  },
  {
    "regionCode": "1117011400",
    "regionName": "신창동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.955,
      37.53577
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1742,
    "facilityScores": {
      "subway": 81,
      "jobs": 89,
      "school": 77,
      "commercial": 81,
      "hospital": 73
    }
  },
  {
    "regionCode": "1117011500",
    "regionName": "산천동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.95142,
      37.53548
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1505,
    "facilityScores": {
      "subway": 74,
      "jobs": 85,
      "school": 75,
      "commercial": 91,
      "hospital": 93
    }
  },
  {
    "regionCode": "1117011600",
    "regionName": "청암동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.94671,
      37.53451
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1678,
    "facilityScores": {
      "subway": 88,
      "jobs": 96,
      "school": 91,
      "commercial": 85,
      "hospital": 75
    }
  },
  {
    "regionCode": "1117011700",
    "regionName": "원효로3가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.95771,
      37.53432
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2046,
    "facilityScores": {
      "subway": 92,
      "jobs": 79,
      "school": 99,
      "commercial": 85,
      "hospital": 88
    }
  },
  {
    "regionCode": "1117011800",
    "regionName": "원효로4가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.95071,
      37.53256
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2024,
    "facilityScores": {
      "subway": 99,
      "jobs": 81,
      "school": 80,
      "commercial": 78,
      "hospital": 86
    }
  },
  {
    "regionCode": "1117011900",
    "regionName": "효창동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96092,
      37.54277
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2017,
    "facilityScores": {
      "subway": 96,
      "jobs": 74,
      "school": 79,
      "commercial": 98,
      "hospital": 87
    }
  },
  {
    "regionCode": "1117012000",
    "regionName": "도원동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.95611,
      37.53877
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1628,
    "facilityScores": {
      "subway": 93,
      "jobs": 89,
      "school": 77,
      "commercial": 74,
      "hospital": 97
    }
  },
  {
    "regionCode": "1117012100",
    "regionName": "용문동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.9597,
      37.53765
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1990,
    "facilityScores": {
      "subway": 76,
      "jobs": 96,
      "school": 89,
      "commercial": 93,
      "hospital": 80
    }
  },
  {
    "regionCode": "1117012200",
    "regionName": "문배동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96941,
      37.53713
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1854,
    "facilityScores": {
      "subway": 80,
      "jobs": 84,
      "school": 78,
      "commercial": 79,
      "hospital": 89
    }
  },
  {
    "regionCode": "1117012300",
    "regionName": "신계동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96579,
      37.53518
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1521,
    "facilityScores": {
      "subway": 89,
      "jobs": 83,
      "school": 88,
      "commercial": 82,
      "hospital": 99
    }
  },
  {
    "regionCode": "1117012400",
    "regionName": "한강로1가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.97303,
      37.53611
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1823,
    "facilityScores": {
      "subway": 99,
      "jobs": 98,
      "school": 86,
      "commercial": 78,
      "hospital": 98
    }
  },
  {
    "regionCode": "1117012500",
    "regionName": "한강로2가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96863,
      37.53156
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1787,
    "facilityScores": {
      "subway": 83,
      "jobs": 91,
      "school": 84,
      "commercial": 81,
      "hospital": 89
    }
  },
  {
    "regionCode": "1117012600",
    "regionName": "용산동3가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.977,
      37.53185
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1905,
    "facilityScores": {
      "subway": 89,
      "jobs": 90,
      "school": 74,
      "commercial": 83,
      "hospital": 77
    }
  },
  {
    "regionCode": "1117012700",
    "regionName": "용산동5가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.97457,
      37.52614
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1730,
    "facilityScores": {
      "subway": 74,
      "jobs": 87,
      "school": 79,
      "commercial": 88,
      "hospital": 97
    }
  },
  {
    "regionCode": "1117012800",
    "regionName": "한강로3가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96221,
      37.52768
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2059,
    "facilityScores": {
      "subway": 93,
      "jobs": 89,
      "school": 94,
      "commercial": 93,
      "hospital": 85
    }
  },
  {
    "regionCode": "1117012900",
    "regionName": "이촌동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.96656,
      37.51746
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1578,
    "facilityScores": {
      "subway": 75,
      "jobs": 86,
      "school": 76,
      "commercial": 92,
      "hospital": 75
    }
  },
  {
    "regionCode": "1117013000",
    "regionName": "이태원동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.99252,
      37.5385
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1903,
    "facilityScores": {
      "subway": 95,
      "jobs": 83,
      "school": 82,
      "commercial": 99,
      "hospital": 77
    }
  },
  {
    "regionCode": "1117013100",
    "regionName": "한남동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      127.00518,
      37.53755
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2144,
    "facilityScores": {
      "subway": 79,
      "jobs": 93,
      "school": 77,
      "commercial": 99,
      "hospital": 91
    }
  },
  {
    "regionCode": "1117013200",
    "regionName": "동빙고동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.99513,
      37.52446
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1852,
    "facilityScores": {
      "subway": 84,
      "jobs": 80,
      "school": 91,
      "commercial": 78,
      "hospital": 97
    }
  },
  {
    "regionCode": "1117013300",
    "regionName": "서빙고동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.99131,
      37.51861
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1776,
    "facilityScores": {
      "subway": 88,
      "jobs": 87,
      "school": 87,
      "commercial": 82,
      "hospital": 90
    }
  },
  {
    "regionCode": "1117013400",
    "regionName": "주성동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.99982,
      37.52131
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1537,
    "facilityScores": {
      "subway": 82,
      "jobs": 78,
      "school": 91,
      "commercial": 75,
      "hospital": 97
    }
  },
  {
    "regionCode": "1117013500",
    "regionName": "용산동6가",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      126.98484,
      37.51867
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2161,
    "facilityScores": {
      "subway": 85,
      "jobs": 95,
      "school": 80,
      "commercial": 75,
      "hospital": 85
    }
  },
  {
    "regionCode": "1117013600",
    "regionName": "보광동",
    "sido": "서울특별시",
    "sggCode": "11170",
    "sggName": "용산구",
    "centroid": [
      127.00094,
      37.52688
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1613,
    "facilityScores": {
      "subway": 99,
      "jobs": 95,
      "school": 91,
      "commercial": 86,
      "hospital": 76
    }
  },
  {
    "regionCode": "1120010100",
    "regionName": "상왕십리동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.02483,
      37.56845
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1781,
    "facilityScores": {
      "subway": 77,
      "jobs": 76,
      "school": 85,
      "commercial": 80,
      "hospital": 96
    }
  },
  {
    "regionCode": "1120010200",
    "regionName": "하왕십리동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.02802,
      37.56395
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2022,
    "facilityScores": {
      "subway": 93,
      "jobs": 76,
      "school": 97,
      "commercial": 98,
      "hospital": 89
    }
  },
  {
    "regionCode": "1120010300",
    "regionName": "홍익동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.03228,
      37.56654
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1653,
    "facilityScores": {
      "subway": 79,
      "jobs": 82,
      "school": 97,
      "commercial": 95,
      "hospital": 83
    }
  },
  {
    "regionCode": "1120010400",
    "regionName": "도선동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.03357,
      37.56383
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2120,
    "facilityScores": {
      "subway": 82,
      "jobs": 87,
      "school": 90,
      "commercial": 82,
      "hospital": 94
    }
  },
  {
    "regionCode": "1120010500",
    "regionName": "마장동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.04076,
      37.56733
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1522,
    "facilityScores": {
      "subway": 80,
      "jobs": 91,
      "school": 76,
      "commercial": 74,
      "hospital": 94
    }
  },
  {
    "regionCode": "1120010600",
    "regionName": "사근동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.0476,
      37.55892
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1531,
    "facilityScores": {
      "subway": 89,
      "jobs": 86,
      "school": 75,
      "commercial": 89,
      "hospital": 81
    }
  },
  {
    "regionCode": "1120010700",
    "regionName": "행당동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.03598,
      37.55766
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1550,
    "facilityScores": {
      "subway": 95,
      "jobs": 82,
      "school": 84,
      "commercial": 84,
      "hospital": 91
    }
  },
  {
    "regionCode": "1120010800",
    "regionName": "응봉동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.03393,
      37.55093
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1841,
    "facilityScores": {
      "subway": 74,
      "jobs": 84,
      "school": 74,
      "commercial": 92,
      "hospital": 74
    }
  },
  {
    "regionCode": "1120010900",
    "regionName": "금호동1가",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.02366,
      37.55348
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2184,
    "facilityScores": {
      "subway": 89,
      "jobs": 74,
      "school": 85,
      "commercial": 97,
      "hospital": 79
    }
  },
  {
    "regionCode": "1120011000",
    "regionName": "금호동2가",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.02113,
      37.55289
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1828,
    "facilityScores": {
      "subway": 81,
      "jobs": 76,
      "school": 77,
      "commercial": 91,
      "hospital": 90
    }
  },
  {
    "regionCode": "1120011100",
    "regionName": "금호동3가",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.0197,
      37.54976
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1920,
    "facilityScores": {
      "subway": 98,
      "jobs": 83,
      "school": 78,
      "commercial": 94,
      "hospital": 78
    }
  },
  {
    "regionCode": "1120011200",
    "regionName": "금호동4가",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.02413,
      37.54542
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2111,
    "facilityScores": {
      "subway": 88,
      "jobs": 83,
      "school": 77,
      "commercial": 79,
      "hospital": 93
    }
  },
  {
    "regionCode": "1120011300",
    "regionName": "옥수동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.02064,
      37.54078
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1509,
    "facilityScores": {
      "subway": 96,
      "jobs": 83,
      "school": 95,
      "commercial": 90,
      "hospital": 81
    }
  },
  {
    "regionCode": "1120011400",
    "regionName": "성수동1가",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.04276,
      37.54347
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1592,
    "facilityScores": {
      "subway": 74,
      "jobs": 73,
      "school": 73,
      "commercial": 77,
      "hospital": 88
    }
  },
  {
    "regionCode": "1120011500",
    "regionName": "성수동2가",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.05655,
      37.54088
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1508,
    "facilityScores": {
      "subway": 87,
      "jobs": 77,
      "school": 78,
      "commercial": 82,
      "hospital": 79
    }
  },
  {
    "regionCode": "1120011800",
    "regionName": "송정동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.0621,
      37.5532
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1626,
    "facilityScores": {
      "subway": 80,
      "jobs": 83,
      "school": 76,
      "commercial": 82,
      "hospital": 83
    }
  },
  {
    "regionCode": "1120012200",
    "regionName": "용답동",
    "sido": "서울특별시",
    "sggCode": "11200",
    "sggName": "성동구",
    "centroid": [
      127.0563,
      37.5615
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1782,
    "facilityScores": {
      "subway": 81,
      "jobs": 97,
      "school": 94,
      "commercial": 82,
      "hospital": 95
    }
  },
  {
    "regionCode": "1121510100",
    "regionName": "중곡동",
    "sido": "서울특별시",
    "sggCode": "11215",
    "sggName": "광진구",
    "centroid": [
      127.0888,
      37.56352
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1310,
    "facilityScores": {
      "subway": 83,
      "jobs": 71,
      "school": 83,
      "commercial": 85,
      "hospital": 66
    }
  },
  {
    "regionCode": "1121510200",
    "regionName": "능동",
    "sido": "서울특별시",
    "sggCode": "11215",
    "sggName": "광진구",
    "centroid": [
      127.08172,
      37.55057
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1319,
    "facilityScores": {
      "subway": 84,
      "jobs": 75,
      "school": 87,
      "commercial": 88,
      "hospital": 64
    }
  },
  {
    "regionCode": "1121510300",
    "regionName": "구의동",
    "sido": "서울특별시",
    "sggCode": "11215",
    "sggName": "광진구",
    "centroid": [
      127.09298,
      37.54442
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1330,
    "facilityScores": {
      "subway": 70,
      "jobs": 78,
      "school": 79,
      "commercial": 64,
      "hospital": 69
    }
  },
  {
    "regionCode": "1121510400",
    "regionName": "광장동",
    "sido": "서울특별시",
    "sggCode": "11215",
    "sggName": "광진구",
    "centroid": [
      127.10473,
      37.54782
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1328,
    "facilityScores": {
      "subway": 78,
      "jobs": 69,
      "school": 87,
      "commercial": 70,
      "hospital": 88
    }
  },
  {
    "regionCode": "1121510500",
    "regionName": "자양동",
    "sido": "서울특별시",
    "sggCode": "11215",
    "sggName": "광진구",
    "centroid": [
      127.07449,
      37.53169
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1090,
    "facilityScores": {
      "subway": 72,
      "jobs": 76,
      "school": 66,
      "commercial": 69,
      "hospital": 87
    }
  },
  {
    "regionCode": "1121510700",
    "regionName": "화양동",
    "sido": "서울특별시",
    "sggCode": "11215",
    "sggName": "광진구",
    "centroid": [
      127.07345,
      37.54327
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1289,
    "facilityScores": {
      "subway": 65,
      "jobs": 88,
      "school": 66,
      "commercial": 83,
      "hospital": 83
    }
  },
  {
    "regionCode": "1121510900",
    "regionName": "군자동",
    "sido": "서울특별시",
    "sggCode": "11215",
    "sggName": "광진구",
    "centroid": [
      127.07366,
      37.55304
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1396,
    "facilityScores": {
      "subway": 78,
      "jobs": 75,
      "school": 75,
      "commercial": 74,
      "hospital": 86
    }
  },
  {
    "regionCode": "1123010100",
    "regionName": "신설동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.02556,
      37.57492
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 775,
    "facilityScores": {
      "subway": 61,
      "jobs": 58,
      "school": 71,
      "commercial": 56,
      "hospital": 71
    }
  },
  {
    "regionCode": "1123010200",
    "regionName": "용두동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.03434,
      37.57573
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 909,
    "facilityScores": {
      "subway": 74,
      "jobs": 62,
      "school": 56,
      "commercial": 70,
      "hospital": 59
    }
  },
  {
    "regionCode": "1123010300",
    "regionName": "제기동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.03725,
      37.58379
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 947,
    "facilityScores": {
      "subway": 70,
      "jobs": 72,
      "school": 74,
      "commercial": 69,
      "hospital": 69
    }
  },
  {
    "regionCode": "1123010700",
    "regionName": "전농동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.05572,
      37.57971
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 839,
    "facilityScores": {
      "subway": 77,
      "jobs": 62,
      "school": 55,
      "commercial": 58,
      "hospital": 56
    }
  },
  {
    "regionCode": "1123010500",
    "regionName": "답십리동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.05678,
      37.57096
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1002,
    "facilityScores": {
      "subway": 61,
      "jobs": 77,
      "school": 72,
      "commercial": 73,
      "hospital": 61
    }
  },
  {
    "regionCode": "1123010600",
    "regionName": "장안동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.07003,
      37.57019
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1055,
    "facilityScores": {
      "subway": 63,
      "jobs": 64,
      "school": 77,
      "commercial": 59,
      "hospital": 66
    }
  },
  {
    "regionCode": "1123010700",
    "regionName": "청량리동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.0453,
      37.58881
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 722,
    "facilityScores": {
      "subway": 55,
      "jobs": 51,
      "school": 67,
      "commercial": 55,
      "hospital": 71
    }
  },
  {
    "regionCode": "1123010800",
    "regionName": "회기동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.05147,
      37.5937
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1025,
    "facilityScores": {
      "subway": 69,
      "jobs": 59,
      "school": 53,
      "commercial": 53,
      "hospital": 52
    }
  },
  {
    "regionCode": "1123010900",
    "regionName": "휘경동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.06451,
      37.58823
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 992,
    "facilityScores": {
      "subway": 53,
      "jobs": 77,
      "school": 70,
      "commercial": 68,
      "hospital": 71
    }
  },
  {
    "regionCode": "1123011000",
    "regionName": "이문동",
    "sido": "서울특별시",
    "sggCode": "11230",
    "sggName": "동대문구",
    "centroid": [
      127.06326,
      37.59946
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 899,
    "facilityScores": {
      "subway": 57,
      "jobs": 60,
      "school": 60,
      "commercial": 77,
      "hospital": 69
    }
  },
  {
    "regionCode": "1126010100",
    "regionName": "면목동",
    "sido": "서울특별시",
    "sggCode": "11260",
    "sggName": "중랑구",
    "centroid": [
      127.08923,
      37.58234
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 882,
    "facilityScores": {
      "subway": 73,
      "jobs": 73,
      "school": 67,
      "commercial": 54,
      "hospital": 61
    }
  },
  {
    "regionCode": "1126010200",
    "regionName": "상봉동",
    "sido": "서울특별시",
    "sggCode": "11260",
    "sggName": "중랑구",
    "centroid": [
      127.08707,
      37.59846
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 936,
    "facilityScores": {
      "subway": 57,
      "jobs": 60,
      "school": 53,
      "commercial": 72,
      "hospital": 74
    }
  },
  {
    "regionCode": "1126010300",
    "regionName": "중화동",
    "sido": "서울특별시",
    "sggCode": "11260",
    "sggName": "중랑구",
    "centroid": [
      127.07816,
      37.6005
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 752,
    "facilityScores": {
      "subway": 62,
      "jobs": 74,
      "school": 69,
      "commercial": 63,
      "hospital": 68
    }
  },
  {
    "regionCode": "1126010400",
    "regionName": "묵동",
    "sido": "서울특별시",
    "sggCode": "11260",
    "sggName": "중랑구",
    "centroid": [
      127.07974,
      37.61271
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1003,
    "facilityScores": {
      "subway": 53,
      "jobs": 66,
      "school": 58,
      "commercial": 76,
      "hospital": 63
    }
  },
  {
    "regionCode": "1126010500",
    "regionName": "망우동",
    "sido": "서울특별시",
    "sggCode": "11260",
    "sggName": "중랑구",
    "centroid": [
      127.10633,
      37.59959
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 957,
    "facilityScores": {
      "subway": 66,
      "jobs": 67,
      "school": 73,
      "commercial": 66,
      "hospital": 54
    }
  },
  {
    "regionCode": "1126010600",
    "regionName": "신내동",
    "sido": "서울특별시",
    "sggCode": "11260",
    "sggName": "중랑구",
    "centroid": [
      127.10082,
      37.61261
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1041,
    "facilityScores": {
      "subway": 75,
      "jobs": 63,
      "school": 70,
      "commercial": 75,
      "hospital": 63
    }
  },
  {
    "regionCode": "1129010100",
    "regionName": "성북동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      126.99289,
      37.59725
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 905,
    "facilityScores": {
      "subway": 77,
      "jobs": 58,
      "school": 68,
      "commercial": 63,
      "hospital": 72
    }
  },
  {
    "regionCode": "1129010200",
    "regionName": "성북동1가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.0037,
      37.58956
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 762,
    "facilityScores": {
      "subway": 76,
      "jobs": 73,
      "school": 55,
      "commercial": 72,
      "hospital": 53
    }
  },
  {
    "regionCode": "1129010300",
    "regionName": "돈암동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.0184,
      37.5978
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 773,
    "facilityScores": {
      "subway": 53,
      "jobs": 71,
      "school": 77,
      "commercial": 55,
      "hospital": 60
    }
  },
  {
    "regionCode": "1129010400",
    "regionName": "동소문동1가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.00727,
      37.59004
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 723,
    "facilityScores": {
      "subway": 53,
      "jobs": 63,
      "school": 57,
      "commercial": 62,
      "hospital": 75
    }
  },
  {
    "regionCode": "1129010500",
    "regionName": "동소문동2가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.00829,
      37.58874
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 883,
    "facilityScores": {
      "subway": 67,
      "jobs": 66,
      "school": 62,
      "commercial": 72,
      "hospital": 71
    }
  },
  {
    "regionCode": "1129010600",
    "regionName": "동소문동3가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01137,
      37.59046
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 745,
    "facilityScores": {
      "subway": 76,
      "jobs": 61,
      "school": 59,
      "commercial": 63,
      "hospital": 76
    }
  },
  {
    "regionCode": "1129010700",
    "regionName": "동소문동4가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01065,
      37.59176
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 962,
    "facilityScores": {
      "subway": 61,
      "jobs": 71,
      "school": 71,
      "commercial": 57,
      "hospital": 73
    }
  },
  {
    "regionCode": "1129010800",
    "regionName": "동소문동5가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01545,
      37.59159
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 809,
    "facilityScores": {
      "subway": 57,
      "jobs": 74,
      "school": 60,
      "commercial": 61,
      "hospital": 77
    }
  },
  {
    "regionCode": "1129010900",
    "regionName": "동소문동6가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01425,
      37.5935
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1026,
    "facilityScores": {
      "subway": 58,
      "jobs": 70,
      "school": 52,
      "commercial": 57,
      "hospital": 67
    }
  },
  {
    "regionCode": "1129011000",
    "regionName": "동소문동7가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01421,
      37.59637
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1049,
    "facilityScores": {
      "subway": 64,
      "jobs": 76,
      "school": 73,
      "commercial": 75,
      "hospital": 67
    }
  },
  {
    "regionCode": "1129011100",
    "regionName": "삼선동1가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.00789,
      37.58489
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 721,
    "facilityScores": {
      "subway": 65,
      "jobs": 76,
      "school": 58,
      "commercial": 63,
      "hospital": 62
    }
  },
  {
    "regionCode": "1129011200",
    "regionName": "삼선동2가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01134,
      37.5839
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 865,
    "facilityScores": {
      "subway": 54,
      "jobs": 55,
      "school": 60,
      "commercial": 72,
      "hospital": 71
    }
  },
  {
    "regionCode": "1129011300",
    "regionName": "삼선동3가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01307,
      37.58651
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 959,
    "facilityScores": {
      "subway": 61,
      "jobs": 65,
      "school": 55,
      "commercial": 69,
      "hospital": 75
    }
  },
  {
    "regionCode": "1129011400",
    "regionName": "삼선동4가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01309,
      37.58999
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 856,
    "facilityScores": {
      "subway": 61,
      "jobs": 58,
      "school": 55,
      "commercial": 72,
      "hospital": 55
    }
  },
  {
    "regionCode": "1129011500",
    "regionName": "삼선동5가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01587,
      37.58853
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 938,
    "facilityScores": {
      "subway": 53,
      "jobs": 77,
      "school": 65,
      "commercial": 59,
      "hospital": 71
    }
  },
  {
    "regionCode": "1129011600",
    "regionName": "동선동1가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01822,
      37.59236
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 891,
    "facilityScores": {
      "subway": 67,
      "jobs": 66,
      "school": 51,
      "commercial": 57,
      "hospital": 54
    }
  },
  {
    "regionCode": "1129011700",
    "regionName": "동선동2가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02002,
      37.59019
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1048,
    "facilityScores": {
      "subway": 73,
      "jobs": 63,
      "school": 57,
      "commercial": 52,
      "hospital": 66
    }
  },
  {
    "regionCode": "1129011800",
    "regionName": "동선동3가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02069,
      37.59399
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1007,
    "facilityScores": {
      "subway": 52,
      "jobs": 69,
      "school": 73,
      "commercial": 74,
      "hospital": 58
    }
  },
  {
    "regionCode": "1129011900",
    "regionName": "동선동4가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01863,
      37.5952
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 969,
    "facilityScores": {
      "subway": 54,
      "jobs": 76,
      "school": 75,
      "commercial": 67,
      "hospital": 74
    }
  },
  {
    "regionCode": "1129012000",
    "regionName": "동선동5가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01667,
      37.59625
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 780,
    "facilityScores": {
      "subway": 75,
      "jobs": 54,
      "school": 68,
      "commercial": 51,
      "hospital": 59
    }
  },
  {
    "regionCode": "1129012100",
    "regionName": "안암동1가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.0221,
      37.58873
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 790,
    "facilityScores": {
      "subway": 56,
      "jobs": 55,
      "school": 54,
      "commercial": 62,
      "hospital": 74
    }
  },
  {
    "regionCode": "1129012200",
    "regionName": "안암동2가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02321,
      37.58691
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 951,
    "facilityScores": {
      "subway": 58,
      "jobs": 71,
      "school": 72,
      "commercial": 55,
      "hospital": 62
    }
  },
  {
    "regionCode": "1129012300",
    "regionName": "안암동3가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02337,
      37.58355
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 796,
    "facilityScores": {
      "subway": 53,
      "jobs": 74,
      "school": 58,
      "commercial": 53,
      "hospital": 76
    }
  },
  {
    "regionCode": "1129012400",
    "regionName": "안암동4가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02468,
      37.58068
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 874,
    "facilityScores": {
      "subway": 74,
      "jobs": 59,
      "school": 55,
      "commercial": 71,
      "hospital": 69
    }
  },
  {
    "regionCode": "1129012500",
    "regionName": "안암동5가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02841,
      37.58846
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1046,
    "facilityScores": {
      "subway": 73,
      "jobs": 67,
      "school": 59,
      "commercial": 71,
      "hospital": 60
    }
  },
  {
    "regionCode": "1129012600",
    "regionName": "보문동4가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.0214,
      37.58293
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 747,
    "facilityScores": {
      "subway": 54,
      "jobs": 64,
      "school": 74,
      "commercial": 71,
      "hospital": 62
    }
  },
  {
    "regionCode": "1129012700",
    "regionName": "보문동5가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02002,
      37.58237
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 805,
    "facilityScores": {
      "subway": 51,
      "jobs": 74,
      "school": 63,
      "commercial": 59,
      "hospital": 71
    }
  },
  {
    "regionCode": "1129012800",
    "regionName": "보문동6가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01886,
      37.58033
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 989,
    "facilityScores": {
      "subway": 72,
      "jobs": 53,
      "school": 55,
      "commercial": 77,
      "hospital": 60
    }
  },
  {
    "regionCode": "1129012900",
    "regionName": "보문동7가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02237,
      37.57979
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 968,
    "facilityScores": {
      "subway": 76,
      "jobs": 63,
      "school": 64,
      "commercial": 66,
      "hospital": 73
    }
  },
  {
    "regionCode": "1129013000",
    "regionName": "보문동1가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01964,
      37.58647
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 989,
    "facilityScores": {
      "subway": 72,
      "jobs": 60,
      "school": 59,
      "commercial": 64,
      "hospital": 69
    }
  },
  {
    "regionCode": "1129013100",
    "regionName": "보문동2가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01822,
      37.58573
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 892,
    "facilityScores": {
      "subway": 60,
      "jobs": 59,
      "school": 75,
      "commercial": 75,
      "hospital": 72
    }
  },
  {
    "regionCode": "1129013200",
    "regionName": "보문동3가",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.01635,
      37.58396
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 797,
    "facilityScores": {
      "subway": 64,
      "jobs": 64,
      "school": 76,
      "commercial": 75,
      "hospital": 67
    }
  },
  {
    "regionCode": "1129013300",
    "regionName": "정릉동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      126.99777,
      37.61551
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 950,
    "facilityScores": {
      "subway": 62,
      "jobs": 54,
      "school": 54,
      "commercial": 62,
      "hospital": 53
    }
  },
  {
    "regionCode": "1129013400",
    "regionName": "길음동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.02221,
      37.60877
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 847,
    "facilityScores": {
      "subway": 70,
      "jobs": 52,
      "school": 54,
      "commercial": 62,
      "hospital": 73
    }
  },
  {
    "regionCode": "1129013500",
    "regionName": "종암동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.03391,
      37.59719
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 942,
    "facilityScores": {
      "subway": 52,
      "jobs": 57,
      "school": 74,
      "commercial": 57,
      "hospital": 57
    }
  },
  {
    "regionCode": "1129013600",
    "regionName": "하월곡동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.03934,
      37.60471
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 970,
    "facilityScores": {
      "subway": 58,
      "jobs": 62,
      "school": 65,
      "commercial": 52,
      "hospital": 55
    }
  },
  {
    "regionCode": "1129013700",
    "regionName": "상월곡동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.04778,
      37.60618
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 853,
    "facilityScores": {
      "subway": 61,
      "jobs": 60,
      "school": 68,
      "commercial": 70,
      "hospital": 55
    }
  },
  {
    "regionCode": "1129013800",
    "regionName": "장위동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.0499,
      37.6152
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 918,
    "facilityScores": {
      "subway": 60,
      "jobs": 76,
      "school": 53,
      "commercial": 57,
      "hospital": 71
    }
  },
  {
    "regionCode": "1129013900",
    "regionName": "석관동",
    "sido": "서울특별시",
    "sggCode": "11290",
    "sggName": "성북구",
    "centroid": [
      127.06146,
      37.60826
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 836,
    "facilityScores": {
      "subway": 69,
      "jobs": 75,
      "school": 53,
      "commercial": 76,
      "hospital": 61
    }
  },
  {
    "regionCode": "1130510100",
    "regionName": "미아동",
    "sido": "서울특별시",
    "sggCode": "11305",
    "sggName": "강북구",
    "centroid": [
      127.02388,
      37.62113
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 968,
    "facilityScores": {
      "subway": 62,
      "jobs": 61,
      "school": 76,
      "commercial": 64,
      "hospital": 73
    }
  },
  {
    "regionCode": "1130510200",
    "regionName": "번동",
    "sido": "서울특별시",
    "sggCode": "11305",
    "sggName": "강북구",
    "centroid": [
      127.03675,
      37.62906
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 844,
    "facilityScores": {
      "subway": 63,
      "jobs": 67,
      "school": 71,
      "commercial": 54,
      "hospital": 76
    }
  },
  {
    "regionCode": "1130510300",
    "regionName": "수유동",
    "sido": "서울특별시",
    "sggCode": "11305",
    "sggName": "강북구",
    "centroid": [
      127.00736,
      37.63833
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 820,
    "facilityScores": {
      "subway": 56,
      "jobs": 75,
      "school": 55,
      "commercial": 70,
      "hospital": 75
    }
  },
  {
    "regionCode": "1130510400",
    "regionName": "우이동",
    "sido": "서울특별시",
    "sggCode": "11305",
    "sggName": "강북구",
    "centroid": [
      127.00052,
      37.6633
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 915,
    "facilityScores": {
      "subway": 65,
      "jobs": 56,
      "school": 64,
      "commercial": 55,
      "hospital": 66
    }
  },
  {
    "regionCode": "1132010500",
    "regionName": "쌍문동",
    "sido": "서울특별시",
    "sggCode": "11320",
    "sggName": "도봉구",
    "centroid": [
      127.02711,
      37.65336
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 997,
    "facilityScores": {
      "subway": 66,
      "jobs": 59,
      "school": 61,
      "commercial": 55,
      "hospital": 70
    }
  },
  {
    "regionCode": "1132010600",
    "regionName": "방학동",
    "sido": "서울특별시",
    "sggCode": "11320",
    "sggName": "도봉구",
    "centroid": [
      127.03109,
      37.66529
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 864,
    "facilityScores": {
      "subway": 70,
      "jobs": 72,
      "school": 76,
      "commercial": 62,
      "hospital": 52
    }
  },
  {
    "regionCode": "1132010700",
    "regionName": "창동",
    "sido": "서울특별시",
    "sggCode": "11320",
    "sggName": "도봉구",
    "centroid": [
      127.04405,
      37.64774
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 807,
    "facilityScores": {
      "subway": 63,
      "jobs": 75,
      "school": 74,
      "commercial": 62,
      "hospital": 63
    }
  },
  {
    "regionCode": "1132010800",
    "regionName": "도봉동",
    "sido": "서울특별시",
    "sggCode": "11320",
    "sggName": "도봉구",
    "centroid": [
      127.02923,
      37.68487
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1056,
    "facilityScores": {
      "subway": 58,
      "jobs": 68,
      "school": 52,
      "commercial": 61,
      "hospital": 63
    }
  },
  {
    "regionCode": "1135010200",
    "regionName": "월계동",
    "sido": "서울특별시",
    "sggCode": "11350",
    "sggName": "노원구",
    "centroid": [
      127.05674,
      37.62824
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 790,
    "facilityScores": {
      "subway": 60,
      "jobs": 62,
      "school": 63,
      "commercial": 74,
      "hospital": 57
    }
  },
  {
    "regionCode": "1135010300",
    "regionName": "공릉동",
    "sido": "서울특별시",
    "sggCode": "11350",
    "sggName": "노원구",
    "centroid": [
      127.091,
      37.63049
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 850,
    "facilityScores": {
      "subway": 52,
      "jobs": 72,
      "school": 61,
      "commercial": 75,
      "hospital": 58
    }
  },
  {
    "regionCode": "1135010400",
    "regionName": "하계동",
    "sido": "서울특별시",
    "sggCode": "11350",
    "sggName": "노원구",
    "centroid": [
      127.07247,
      37.63764
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 896,
    "facilityScores": {
      "subway": 76,
      "jobs": 69,
      "school": 68,
      "commercial": 72,
      "hospital": 73
    }
  },
  {
    "regionCode": "1135010500",
    "regionName": "상계동",
    "sido": "서울특별시",
    "sggCode": "11350",
    "sggName": "노원구",
    "centroid": [
      127.07032,
      37.67299
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 838,
    "facilityScores": {
      "subway": 57,
      "jobs": 68,
      "school": 69,
      "commercial": 58,
      "hospital": 57
    }
  },
  {
    "regionCode": "1135010600",
    "regionName": "중계동",
    "sido": "서울특별시",
    "sggCode": "11350",
    "sggName": "노원구",
    "centroid": [
      127.08002,
      37.65102
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 880,
    "facilityScores": {
      "subway": 70,
      "jobs": 63,
      "school": 72,
      "commercial": 59,
      "hospital": 59
    }
  },
  {
    "regionCode": "1138010100",
    "regionName": "수색동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.89459,
      37.58551
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 847,
    "facilityScores": {
      "subway": 77,
      "jobs": 74,
      "school": 60,
      "commercial": 68,
      "hospital": 72
    }
  },
  {
    "regionCode": "1138010200",
    "regionName": "녹번동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.93457,
      37.6053
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 786,
    "facilityScores": {
      "subway": 68,
      "jobs": 57,
      "school": 55,
      "commercial": 71,
      "hospital": 65
    }
  },
  {
    "regionCode": "1138010300",
    "regionName": "불광동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.9356,
      37.61915
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 986,
    "facilityScores": {
      "subway": 64,
      "jobs": 61,
      "school": 64,
      "commercial": 73,
      "hospital": 70
    }
  },
  {
    "regionCode": "1138010400",
    "regionName": "갈현동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.91358,
      37.62156
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 898,
    "facilityScores": {
      "subway": 75,
      "jobs": 51,
      "school": 60,
      "commercial": 55,
      "hospital": 59
    }
  },
  {
    "regionCode": "1138010500",
    "regionName": "구산동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.90731,
      37.6111
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1003,
    "facilityScores": {
      "subway": 76,
      "jobs": 61,
      "school": 56,
      "commercial": 61,
      "hospital": 68
    }
  },
  {
    "regionCode": "1138010600",
    "regionName": "대조동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.92314,
      37.61227
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 816,
    "facilityScores": {
      "subway": 57,
      "jobs": 61,
      "school": 56,
      "commercial": 64,
      "hospital": 51
    }
  },
  {
    "regionCode": "1138010700",
    "regionName": "응암동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.92314,
      37.59384
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1050,
    "facilityScores": {
      "subway": 65,
      "jobs": 66,
      "school": 74,
      "commercial": 72,
      "hospital": 53
    }
  },
  {
    "regionCode": "1138010800",
    "regionName": "역촌동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.91456,
      37.6046
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1051,
    "facilityScores": {
      "subway": 64,
      "jobs": 56,
      "school": 52,
      "commercial": 61,
      "hospital": 56
    }
  },
  {
    "regionCode": "1138010900",
    "regionName": "신사동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.90721,
      37.59561
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 933,
    "facilityScores": {
      "subway": 67,
      "jobs": 69,
      "school": 75,
      "commercial": 52,
      "hospital": 71
    }
  },
  {
    "regionCode": "1138011000",
    "regionName": "증산동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.90594,
      37.58417
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 835,
    "facilityScores": {
      "subway": 52,
      "jobs": 74,
      "school": 53,
      "commercial": 61,
      "hospital": 69
    }
  },
  {
    "regionCode": "1138011400",
    "regionName": "진관동",
    "sido": "서울특별시",
    "sggCode": "11380",
    "sggName": "은평구",
    "centroid": [
      126.93781,
      37.63967
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 798,
    "facilityScores": {
      "subway": 58,
      "jobs": 72,
      "school": 68,
      "commercial": 66,
      "hospital": 72
    }
  },
  {
    "regionCode": "1141010100",
    "regionName": "충정로2가",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.96417,
      37.56487
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 898,
    "facilityScores": {
      "subway": 61,
      "jobs": 70,
      "school": 66,
      "commercial": 68,
      "hospital": 63
    }
  },
  {
    "regionCode": "1141010200",
    "regionName": "충정로3가",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.96196,
      37.56213
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 887,
    "facilityScores": {
      "subway": 61,
      "jobs": 58,
      "school": 66,
      "commercial": 71,
      "hospital": 57
    }
  },
  {
    "regionCode": "1141010300",
    "regionName": "합동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.96609,
      37.56158
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 938,
    "facilityScores": {
      "subway": 63,
      "jobs": 61,
      "school": 60,
      "commercial": 59,
      "hospital": 76
    }
  },
  {
    "regionCode": "1141010400",
    "regionName": "미근동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.96724,
      37.56331
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 890,
    "facilityScores": {
      "subway": 65,
      "jobs": 72,
      "school": 74,
      "commercial": 72,
      "hospital": 70
    }
  },
  {
    "regionCode": "1141010500",
    "regionName": "냉천동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.96229,
      37.56681
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 949,
    "facilityScores": {
      "subway": 70,
      "jobs": 73,
      "school": 56,
      "commercial": 62,
      "hospital": 51
    }
  },
  {
    "regionCode": "1141010600",
    "regionName": "천연동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.95948,
      37.56793
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 730,
    "facilityScores": {
      "subway": 67,
      "jobs": 69,
      "school": 60,
      "commercial": 53,
      "hospital": 53
    }
  },
  {
    "regionCode": "1141010700",
    "regionName": "옥천동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.95932,
      37.56943
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1050,
    "facilityScores": {
      "subway": 70,
      "jobs": 69,
      "school": 73,
      "commercial": 52,
      "hospital": 74
    }
  },
  {
    "regionCode": "1141010800",
    "regionName": "영천동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.95761,
      37.5703
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 936,
    "facilityScores": {
      "subway": 70,
      "jobs": 75,
      "school": 54,
      "commercial": 61,
      "hospital": 61
    }
  },
  {
    "regionCode": "1141010900",
    "regionName": "현저동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.95401,
      37.57378
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 948,
    "facilityScores": {
      "subway": 62,
      "jobs": 75,
      "school": 58,
      "commercial": 66,
      "hospital": 56
    }
  },
  {
    "regionCode": "1141011000",
    "regionName": "북아현동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.95441,
      37.56242
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 999,
    "facilityScores": {
      "subway": 53,
      "jobs": 71,
      "school": 75,
      "commercial": 53,
      "hospital": 61
    }
  },
  {
    "regionCode": "1141011100",
    "regionName": "홍제동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.94897,
      37.58707
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 996,
    "facilityScores": {
      "subway": 71,
      "jobs": 71,
      "school": 70,
      "commercial": 63,
      "hospital": 54
    }
  },
  {
    "regionCode": "1141011200",
    "regionName": "대현동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.94633,
      37.56038
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 879,
    "facilityScores": {
      "subway": 54,
      "jobs": 70,
      "school": 52,
      "commercial": 72,
      "hospital": 71
    }
  },
  {
    "regionCode": "1141011300",
    "regionName": "대신동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.94432,
      37.56421
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1034,
    "facilityScores": {
      "subway": 56,
      "jobs": 68,
      "school": 62,
      "commercial": 57,
      "hospital": 66
    }
  },
  {
    "regionCode": "1141011400",
    "regionName": "신촌동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.93996,
      37.56511
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 967,
    "facilityScores": {
      "subway": 65,
      "jobs": 58,
      "school": 76,
      "commercial": 60,
      "hospital": 66
    }
  },
  {
    "regionCode": "1141011500",
    "regionName": "봉원동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.94693,
      37.57264
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 947,
    "facilityScores": {
      "subway": 58,
      "jobs": 59,
      "school": 63,
      "commercial": 56,
      "hospital": 68
    }
  },
  {
    "regionCode": "1141011600",
    "regionName": "창천동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.93423,
      37.5587
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1018,
    "facilityScores": {
      "subway": 62,
      "jobs": 57,
      "school": 68,
      "commercial": 67,
      "hospital": 53
    }
  },
  {
    "regionCode": "1141011700",
    "regionName": "연희동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.93285,
      37.57199
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 723,
    "facilityScores": {
      "subway": 76,
      "jobs": 55,
      "school": 61,
      "commercial": 75,
      "hospital": 70
    }
  },
  {
    "regionCode": "1141011800",
    "regionName": "홍은동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.93857,
      37.59301
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 838,
    "facilityScores": {
      "subway": 65,
      "jobs": 63,
      "school": 75,
      "commercial": 57,
      "hospital": 63
    }
  },
  {
    "regionCode": "1141011900",
    "regionName": "북가좌동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.91121,
      37.57899
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 936,
    "facilityScores": {
      "subway": 58,
      "jobs": 63,
      "school": 77,
      "commercial": 59,
      "hospital": 77
    }
  },
  {
    "regionCode": "1141012000",
    "regionName": "남가좌동",
    "sido": "서울특별시",
    "sggCode": "11410",
    "sggName": "서대문구",
    "centroid": [
      126.91926,
      37.57549
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 897,
    "facilityScores": {
      "subway": 76,
      "jobs": 65,
      "school": 54,
      "commercial": 66,
      "hospital": 60
    }
  },
  {
    "regionCode": "1144010100",
    "regionName": "아현동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.9563,
      37.55447
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1093,
    "facilityScores": {
      "subway": 66,
      "jobs": 65,
      "school": 64,
      "commercial": 78,
      "hospital": 81
    }
  },
  {
    "regionCode": "1144010200",
    "regionName": "공덕동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.95502,
      37.54811
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1090,
    "facilityScores": {
      "subway": 87,
      "jobs": 85,
      "school": 66,
      "commercial": 67,
      "hospital": 72
    }
  },
  {
    "regionCode": "1144010300",
    "regionName": "신공덕동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.95592,
      37.54414
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1149,
    "facilityScores": {
      "subway": 81,
      "jobs": 85,
      "school": 86,
      "commercial": 78,
      "hospital": 70
    }
  },
  {
    "regionCode": "1144010400",
    "regionName": "도화동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.95004,
      37.53975
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1354,
    "facilityScores": {
      "subway": 84,
      "jobs": 69,
      "school": 76,
      "commercial": 86,
      "hospital": 85
    }
  },
  {
    "regionCode": "1144010500",
    "regionName": "용강동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.94046,
      37.54151
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1299,
    "facilityScores": {
      "subway": 83,
      "jobs": 77,
      "school": 75,
      "commercial": 79,
      "hospital": 78
    }
  },
  {
    "regionCode": "1144010600",
    "regionName": "토정동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.93978,
      37.53888
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1448,
    "facilityScores": {
      "subway": 88,
      "jobs": 66,
      "school": 87,
      "commercial": 79,
      "hospital": 74
    }
  },
  {
    "regionCode": "1144010700",
    "regionName": "마포동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.94383,
      37.53711
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1405,
    "facilityScores": {
      "subway": 76,
      "jobs": 73,
      "school": 66,
      "commercial": 70,
      "hospital": 71
    }
  },
  {
    "regionCode": "1144010800",
    "regionName": "대흥동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.9432,
      37.54982
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1286,
    "facilityScores": {
      "subway": 81,
      "jobs": 64,
      "school": 84,
      "commercial": 78,
      "hospital": 77
    }
  },
  {
    "regionCode": "1144010900",
    "regionName": "염리동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.94732,
      37.54907
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1470,
    "facilityScores": {
      "subway": 83,
      "jobs": 67,
      "school": 66,
      "commercial": 73,
      "hospital": 82
    }
  },
  {
    "regionCode": "1144011000",
    "regionName": "노고산동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.9378,
      37.5544
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1123,
    "facilityScores": {
      "subway": 69,
      "jobs": 72,
      "school": 80,
      "commercial": 80,
      "hospital": 81
    }
  },
  {
    "regionCode": "1144011100",
    "regionName": "신수동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.93681,
      37.54853
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1050,
    "facilityScores": {
      "subway": 66,
      "jobs": 75,
      "school": 75,
      "commercial": 63,
      "hospital": 72
    }
  },
  {
    "regionCode": "1144011200",
    "regionName": "현석동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.93427,
      37.54216
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1265,
    "facilityScores": {
      "subway": 73,
      "jobs": 82,
      "school": 82,
      "commercial": 87,
      "hospital": 67
    }
  },
  {
    "regionCode": "1144011300",
    "regionName": "구수동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.93256,
      37.54573
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1139,
    "facilityScores": {
      "subway": 74,
      "jobs": 68,
      "school": 77,
      "commercial": 63,
      "hospital": 82
    }
  },
  {
    "regionCode": "1144011400",
    "regionName": "창전동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.93009,
      37.55031
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1411,
    "facilityScores": {
      "subway": 82,
      "jobs": 82,
      "school": 81,
      "commercial": 68,
      "hospital": 74
    }
  },
  {
    "regionCode": "1144011500",
    "regionName": "상수동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.92449,
      37.54667
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1392,
    "facilityScores": {
      "subway": 85,
      "jobs": 65,
      "school": 77,
      "commercial": 81,
      "hospital": 66
    }
  },
  {
    "regionCode": "1144011600",
    "regionName": "하중동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.92776,
      37.54357
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1155,
    "facilityScores": {
      "subway": 89,
      "jobs": 68,
      "school": 72,
      "commercial": 75,
      "hospital": 85
    }
  },
  {
    "regionCode": "1144011700",
    "regionName": "신정동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.93033,
      37.54316
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1244,
    "facilityScores": {
      "subway": 81,
      "jobs": 65,
      "school": 83,
      "commercial": 83,
      "hospital": 65
    }
  },
  {
    "regionCode": "1144011800",
    "regionName": "당인동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.91962,
      37.54378
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1389,
    "facilityScores": {
      "subway": 75,
      "jobs": 63,
      "school": 88,
      "commercial": 89,
      "hospital": 89
    }
  },
  {
    "regionCode": "1144012000",
    "regionName": "서교동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.91873,
      37.55384
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1140,
    "facilityScores": {
      "subway": 85,
      "jobs": 71,
      "school": 74,
      "commercial": 73,
      "hospital": 72
    }
  },
  {
    "regionCode": "1144012100",
    "regionName": "동교동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.92517,
      37.55759
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1125,
    "facilityScores": {
      "subway": 64,
      "jobs": 77,
      "school": 63,
      "commercial": 70,
      "hospital": 65
    }
  },
  {
    "regionCode": "1144012200",
    "regionName": "합정동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.90905,
      37.54704
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1339,
    "facilityScores": {
      "subway": 68,
      "jobs": 70,
      "school": 69,
      "commercial": 68,
      "hospital": 87
    }
  },
  {
    "regionCode": "1144012300",
    "regionName": "망원동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.89986,
      37.55549
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1378,
    "facilityScores": {
      "subway": 75,
      "jobs": 68,
      "school": 64,
      "commercial": 86,
      "hospital": 69
    }
  },
  {
    "regionCode": "1144012400",
    "regionName": "연남동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.92151,
      37.563
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1200,
    "facilityScores": {
      "subway": 72,
      "jobs": 79,
      "school": 76,
      "commercial": 66,
      "hospital": 76
    }
  },
  {
    "regionCode": "1144012500",
    "regionName": "성산동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.90469,
      37.56566
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1167,
    "facilityScores": {
      "subway": 79,
      "jobs": 75,
      "school": 63,
      "commercial": 77,
      "hospital": 77
    }
  },
  {
    "regionCode": "1144012600",
    "regionName": "중동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.90619,
      37.57161
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1312,
    "facilityScores": {
      "subway": 84,
      "jobs": 76,
      "school": 84,
      "commercial": 73,
      "hospital": 65
    }
  },
  {
    "regionCode": "1144012700",
    "regionName": "상암동",
    "sido": "서울특별시",
    "sggCode": "11440",
    "sggName": "마포구",
    "centroid": [
      126.87986,
      37.5707
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1289,
    "facilityScores": {
      "subway": 80,
      "jobs": 68,
      "school": 67,
      "commercial": 88,
      "hospital": 85
    }
  },
  {
    "regionCode": "1147010100",
    "regionName": "신정동",
    "sido": "서울특별시",
    "sggCode": "11470",
    "sggName": "양천구",
    "centroid": [
      126.85573,
      37.51518
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1183,
    "facilityScores": {
      "subway": 84,
      "jobs": 66,
      "school": 78,
      "commercial": 85,
      "hospital": 82
    }
  },
  {
    "regionCode": "1147010200",
    "regionName": "목동",
    "sido": "서울특별시",
    "sggCode": "11470",
    "sggName": "양천구",
    "centroid": [
      126.87452,
      37.53602
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1105,
    "facilityScores": {
      "subway": 72,
      "jobs": 84,
      "school": 72,
      "commercial": 87,
      "hospital": 63
    }
  },
  {
    "regionCode": "1147010300",
    "regionName": "신월동",
    "sido": "서울특별시",
    "sggCode": "11470",
    "sggName": "양천구",
    "centroid": [
      126.83434,
      37.5266
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1140,
    "facilityScores": {
      "subway": 70,
      "jobs": 87,
      "school": 84,
      "commercial": 68,
      "hospital": 74
    }
  },
  {
    "regionCode": "1150010100",
    "regionName": "염창동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.87178,
      37.55454
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 731,
    "facilityScores": {
      "subway": 65,
      "jobs": 65,
      "school": 64,
      "commercial": 64,
      "hospital": 70
    }
  },
  {
    "regionCode": "1150010200",
    "regionName": "등촌동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.85429,
      37.55457
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 850,
    "facilityScores": {
      "subway": 76,
      "jobs": 64,
      "school": 65,
      "commercial": 74,
      "hospital": 66
    }
  },
  {
    "regionCode": "1150010300",
    "regionName": "화곡동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.84727,
      37.5407
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 814,
    "facilityScores": {
      "subway": 75,
      "jobs": 75,
      "school": 61,
      "commercial": 71,
      "hospital": 61
    }
  },
  {
    "regionCode": "1150010400",
    "regionName": "가양동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.8511,
      37.56785
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 799,
    "facilityScores": {
      "subway": 52,
      "jobs": 61,
      "school": 64,
      "commercial": 56,
      "hospital": 75
    }
  },
  {
    "regionCode": "1150010500",
    "regionName": "마곡동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.82942,
      37.56867
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 998,
    "facilityScores": {
      "subway": 76,
      "jobs": 68,
      "school": 61,
      "commercial": 60,
      "hospital": 66
    }
  },
  {
    "regionCode": "1150010600",
    "regionName": "내발산동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.83329,
      37.5525
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 937,
    "facilityScores": {
      "subway": 60,
      "jobs": 63,
      "school": 69,
      "commercial": 75,
      "hospital": 66
    }
  },
  {
    "regionCode": "1150010700",
    "regionName": "외발산동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.81965,
      37.54707
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 979,
    "facilityScores": {
      "subway": 59,
      "jobs": 57,
      "school": 62,
      "commercial": 75,
      "hospital": 66
    }
  },
  {
    "regionCode": "1150010800",
    "regionName": "공항동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.80894,
      37.55393
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 778,
    "facilityScores": {
      "subway": 54,
      "jobs": 54,
      "school": 67,
      "commercial": 74,
      "hospital": 72
    }
  },
  {
    "regionCode": "1150010900",
    "regionName": "방화동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.81357,
      37.57587
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 934,
    "facilityScores": {
      "subway": 66,
      "jobs": 56,
      "school": 75,
      "commercial": 58,
      "hospital": 54
    }
  },
  {
    "regionCode": "1150011000",
    "regionName": "개화동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.8036,
      37.58712
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 869,
    "facilityScores": {
      "subway": 69,
      "jobs": 68,
      "school": 68,
      "commercial": 69,
      "hospital": 53
    }
  },
  {
    "regionCode": "1150011100",
    "regionName": "과해동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.78782,
      37.5656
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 838,
    "facilityScores": {
      "subway": 71,
      "jobs": 70,
      "school": 53,
      "commercial": 75,
      "hospital": 61
    }
  },
  {
    "regionCode": "1150011200",
    "regionName": "오곡동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.78479,
      37.55294
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 771,
    "facilityScores": {
      "subway": 52,
      "jobs": 70,
      "school": 54,
      "commercial": 53,
      "hospital": 73
    }
  },
  {
    "regionCode": "1150011300",
    "regionName": "오쇠동",
    "sido": "서울특별시",
    "sggCode": "11500",
    "sggName": "강서구",
    "centroid": [
      126.79797,
      37.54348
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 834,
    "facilityScores": {
      "subway": 75,
      "jobs": 62,
      "school": 63,
      "commercial": 67,
      "hospital": 62
    }
  },
  {
    "regionCode": "1153010100",
    "regionName": "신도림동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.8822,
      37.50993
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 846,
    "facilityScores": {
      "subway": 70,
      "jobs": 58,
      "school": 62,
      "commercial": 60,
      "hospital": 71
    }
  },
  {
    "regionCode": "1153010200",
    "regionName": "구로동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.88471,
      37.49422
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 741,
    "facilityScores": {
      "subway": 60,
      "jobs": 73,
      "school": 59,
      "commercial": 60,
      "hospital": 61
    }
  },
  {
    "regionCode": "1153010300",
    "regionName": "가리봉동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.88794,
      37.48277
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 888,
    "facilityScores": {
      "subway": 58,
      "jobs": 53,
      "school": 69,
      "commercial": 56,
      "hospital": 69
    }
  },
  {
    "regionCode": "1153010600",
    "regionName": "고척동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.85887,
      37.50317
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1040,
    "facilityScores": {
      "subway": 63,
      "jobs": 74,
      "school": 59,
      "commercial": 76,
      "hospital": 52
    }
  },
  {
    "regionCode": "1153010700",
    "regionName": "개봉동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.85195,
      37.4942
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1043,
    "facilityScores": {
      "subway": 59,
      "jobs": 67,
      "school": 62,
      "commercial": 60,
      "hospital": 64
    }
  },
  {
    "regionCode": "1153010800",
    "regionName": "오류동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.8386,
      37.49167
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 995,
    "facilityScores": {
      "subway": 70,
      "jobs": 56,
      "school": 68,
      "commercial": 77,
      "hospital": 75
    }
  },
  {
    "regionCode": "1153010900",
    "regionName": "궁동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.82854,
      37.50043
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1016,
    "facilityScores": {
      "subway": 71,
      "jobs": 70,
      "school": 51,
      "commercial": 66,
      "hospital": 52
    }
  },
  {
    "regionCode": "1153011000",
    "regionName": "온수동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.82065,
      37.49414
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 790,
    "facilityScores": {
      "subway": 74,
      "jobs": 54,
      "school": 58,
      "commercial": 67,
      "hospital": 68
    }
  },
  {
    "regionCode": "1153011100",
    "regionName": "천왕동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.83986,
      37.48025
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 885,
    "facilityScores": {
      "subway": 58,
      "jobs": 72,
      "school": 68,
      "commercial": 57,
      "hospital": 55
    }
  },
  {
    "regionCode": "1153011200",
    "regionName": "항동",
    "sido": "서울특별시",
    "sggCode": "11530",
    "sggName": "구로구",
    "centroid": [
      126.8246,
      37.481
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 821,
    "facilityScores": {
      "subway": 68,
      "jobs": 69,
      "school": 57,
      "commercial": 60,
      "hospital": 60
    }
  },
  {
    "regionCode": "1154510100",
    "regionName": "가산동",
    "sido": "서울특별시",
    "sggCode": "11545",
    "sggName": "금천구",
    "centroid": [
      126.88382,
      37.47668
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 782,
    "facilityScores": {
      "subway": 69,
      "jobs": 75,
      "school": 52,
      "commercial": 52,
      "hospital": 58
    }
  },
  {
    "regionCode": "1154510200",
    "regionName": "독산동",
    "sido": "서울특별시",
    "sggCode": "11545",
    "sggName": "금천구",
    "centroid": [
      126.8983,
      37.46748
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 889,
    "facilityScores": {
      "subway": 59,
      "jobs": 63,
      "school": 68,
      "commercial": 64,
      "hospital": 61
    }
  },
  {
    "regionCode": "1154510300",
    "regionName": "시흥동",
    "sido": "서울특별시",
    "sggCode": "11545",
    "sggName": "금천구",
    "centroid": [
      126.90929,
      37.44954
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 780,
    "facilityScores": {
      "subway": 61,
      "jobs": 59,
      "school": 63,
      "commercial": 54,
      "hospital": 53
    }
  },
  {
    "regionCode": "1156010100",
    "regionName": "영등포동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90691,
      37.51381
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1150,
    "facilityScores": {
      "subway": 72,
      "jobs": 71,
      "school": 85,
      "commercial": 71,
      "hospital": 75
    }
  },
  {
    "regionCode": "1156010200",
    "regionName": "영등포동1가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.91292,
      37.5176
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1301,
    "facilityScores": {
      "subway": 88,
      "jobs": 87,
      "school": 88,
      "commercial": 70,
      "hospital": 89
    }
  },
  {
    "regionCode": "1156010300",
    "regionName": "영등포동2가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.91224,
      37.52061
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1183,
    "facilityScores": {
      "subway": 67,
      "jobs": 67,
      "school": 78,
      "commercial": 80,
      "hospital": 78
    }
  },
  {
    "regionCode": "1156010400",
    "regionName": "영등포동3가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90793,
      37.51821
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1130,
    "facilityScores": {
      "subway": 68,
      "jobs": 80,
      "school": 64,
      "commercial": 65,
      "hospital": 87
    }
  },
  {
    "regionCode": "1156010500",
    "regionName": "영등포동4가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90359,
      37.51789
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1425,
    "facilityScores": {
      "subway": 87,
      "jobs": 75,
      "school": 73,
      "commercial": 75,
      "hospital": 80
    }
  },
  {
    "regionCode": "1156010600",
    "regionName": "영등포동5가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90671,
      37.52108
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1368,
    "facilityScores": {
      "subway": 86,
      "jobs": 75,
      "school": 85,
      "commercial": 87,
      "hospital": 86
    }
  },
  {
    "regionCode": "1156010700",
    "regionName": "영등포동6가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90315,
      37.52159
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1244,
    "facilityScores": {
      "subway": 70,
      "jobs": 85,
      "school": 71,
      "commercial": 76,
      "hospital": 67
    }
  },
  {
    "regionCode": "1156010800",
    "regionName": "영등포동7가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.9071,
      37.52428
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1348,
    "facilityScores": {
      "subway": 84,
      "jobs": 85,
      "school": 88,
      "commercial": 64,
      "hospital": 70
    }
  },
  {
    "regionCode": "1156010900",
    "regionName": "영등포동8가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90532,
      37.52834
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1233,
    "facilityScores": {
      "subway": 81,
      "jobs": 68,
      "school": 80,
      "commercial": 88,
      "hospital": 73
    }
  },
  {
    "regionCode": "1156011000",
    "regionName": "여의도동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.92845,
      37.52865
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1136,
    "facilityScores": {
      "subway": 76,
      "jobs": 69,
      "school": 65,
      "commercial": 80,
      "hospital": 69
    }
  },
  {
    "regionCode": "1156011100",
    "regionName": "당산동1가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89853,
      37.52167
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1403,
    "facilityScores": {
      "subway": 84,
      "jobs": 83,
      "school": 74,
      "commercial": 65,
      "hospital": 77
    }
  },
  {
    "regionCode": "1156011200",
    "regionName": "당산동2가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89371,
      37.52248
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1266,
    "facilityScores": {
      "subway": 66,
      "jobs": 65,
      "school": 87,
      "commercial": 65,
      "hospital": 70
    }
  },
  {
    "regionCode": "1156011300",
    "regionName": "당산동3가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89712,
      37.52587
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1330,
    "facilityScores": {
      "subway": 64,
      "jobs": 80,
      "school": 73,
      "commercial": 72,
      "hospital": 70
    }
  },
  {
    "regionCode": "1156011400",
    "regionName": "당산동4가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89915,
      37.52901
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1465,
    "facilityScores": {
      "subway": 82,
      "jobs": 65,
      "school": 78,
      "commercial": 66,
      "hospital": 71
    }
  },
  {
    "regionCode": "1156011500",
    "regionName": "당산동5가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90119,
      37.53209
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1237,
    "facilityScores": {
      "subway": 80,
      "jobs": 82,
      "school": 83,
      "commercial": 79,
      "hospital": 89
    }
  },
  {
    "regionCode": "1156011600",
    "regionName": "당산동6가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90283,
      37.53467
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1260,
    "facilityScores": {
      "subway": 86,
      "jobs": 85,
      "school": 83,
      "commercial": 85,
      "hospital": 74
    }
  },
  {
    "regionCode": "1156011700",
    "regionName": "당산동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90398,
      37.53642
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1237,
    "facilityScores": {
      "subway": 79,
      "jobs": 72,
      "school": 67,
      "commercial": 72,
      "hospital": 82
    }
  },
  {
    "regionCode": "1156011800",
    "regionName": "도림동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90057,
      37.50912
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1080,
    "facilityScores": {
      "subway": 80,
      "jobs": 78,
      "school": 72,
      "commercial": 65,
      "hospital": 66
    }
  },
  {
    "regionCode": "1156011900",
    "regionName": "문래동1가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89703,
      37.51228
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1069,
    "facilityScores": {
      "subway": 70,
      "jobs": 85,
      "school": 84,
      "commercial": 69,
      "hospital": 81
    }
  },
  {
    "regionCode": "1156012000",
    "regionName": "문래동2가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89305,
      37.51277
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1422,
    "facilityScores": {
      "subway": 64,
      "jobs": 76,
      "school": 72,
      "commercial": 69,
      "hospital": 75
    }
  },
  {
    "regionCode": "1156012100",
    "regionName": "문래동3가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89572,
      37.51726
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1372,
    "facilityScores": {
      "subway": 66,
      "jobs": 84,
      "school": 72,
      "commercial": 71,
      "hospital": 78
    }
  },
  {
    "regionCode": "1156012200",
    "regionName": "문래동4가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.88985,
      37.51449
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1400,
    "facilityScores": {
      "subway": 73,
      "jobs": 87,
      "school": 76,
      "commercial": 68,
      "hospital": 77
    }
  },
  {
    "regionCode": "1156012300",
    "regionName": "문래동5가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.88389,
      37.51668
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1488,
    "facilityScores": {
      "subway": 74,
      "jobs": 83,
      "school": 75,
      "commercial": 64,
      "hospital": 79
    }
  },
  {
    "regionCode": "1156012400",
    "regionName": "문래동6가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.88464,
      37.5199
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1242,
    "facilityScores": {
      "subway": 71,
      "jobs": 89,
      "school": 71,
      "commercial": 64,
      "hospital": 81
    }
  },
  {
    "regionCode": "1156012500",
    "regionName": "양평동1가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.88869,
      37.52321
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1166,
    "facilityScores": {
      "subway": 64,
      "jobs": 73,
      "school": 87,
      "commercial": 67,
      "hospital": 80
    }
  },
  {
    "regionCode": "1156012600",
    "regionName": "양평동2가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.88378,
      37.52343
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1080,
    "facilityScores": {
      "subway": 84,
      "jobs": 88,
      "school": 81,
      "commercial": 68,
      "hospital": 88
    }
  },
  {
    "regionCode": "1156012700",
    "regionName": "양평동3가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89104,
      37.52905
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1472,
    "facilityScores": {
      "subway": 67,
      "jobs": 70,
      "school": 74,
      "commercial": 72,
      "hospital": 75
    }
  },
  {
    "regionCode": "1156012800",
    "regionName": "양평동4가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89615,
      37.53631
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1221,
    "facilityScores": {
      "subway": 72,
      "jobs": 68,
      "school": 73,
      "commercial": 65,
      "hospital": 87
    }
  },
  {
    "regionCode": "1156012900",
    "regionName": "양평동5가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.89262,
      37.53935
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1064,
    "facilityScores": {
      "subway": 76,
      "jobs": 79,
      "school": 77,
      "commercial": 65,
      "hospital": 77
    }
  },
  {
    "regionCode": "1156013000",
    "regionName": "양평동6가",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.88955,
      37.5427
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1085,
    "facilityScores": {
      "subway": 66,
      "jobs": 89,
      "school": 79,
      "commercial": 77,
      "hospital": 63
    }
  },
  {
    "regionCode": "1156013100",
    "regionName": "양화동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.8891,
      37.54795
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1428,
    "facilityScores": {
      "subway": 87,
      "jobs": 63,
      "school": 78,
      "commercial": 64,
      "hospital": 78
    }
  },
  {
    "regionCode": "1156013200",
    "regionName": "신길동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.9136,
      37.5061
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1278,
    "facilityScores": {
      "subway": 68,
      "jobs": 78,
      "school": 70,
      "commercial": 71,
      "hospital": 63
    }
  },
  {
    "regionCode": "1156013300",
    "regionName": "대림동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.90015,
      37.49544
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1215,
    "facilityScores": {
      "subway": 67,
      "jobs": 68,
      "school": 63,
      "commercial": 75,
      "hospital": 86
    }
  },
  {
    "regionCode": "1156013400",
    "regionName": "양평동",
    "sido": "서울특별시",
    "sggCode": "11560",
    "sggName": "영등포구",
    "centroid": [
      126.88898,
      37.53769
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1427,
    "facilityScores": {
      "subway": 83,
      "jobs": 63,
      "school": 88,
      "commercial": 79,
      "hospital": 68
    }
  },
  {
    "regionCode": "1159010100",
    "regionName": "노량진동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.94188,
      37.51158
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1114,
    "facilityScores": {
      "subway": 86,
      "jobs": 80,
      "school": 78,
      "commercial": 67,
      "hospital": 72
    }
  },
  {
    "regionCode": "1159010200",
    "regionName": "상도동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.94403,
      37.49872
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1162,
    "facilityScores": {
      "subway": 79,
      "jobs": 87,
      "school": 69,
      "commercial": 89,
      "hospital": 72
    }
  },
  {
    "regionCode": "1159010300",
    "regionName": "상도1동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.95063,
      37.50325
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1133,
    "facilityScores": {
      "subway": 70,
      "jobs": 79,
      "school": 65,
      "commercial": 67,
      "hospital": 69
    }
  },
  {
    "regionCode": "1159010400",
    "regionName": "본동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.95366,
      37.51245
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1428,
    "facilityScores": {
      "subway": 66,
      "jobs": 76,
      "school": 82,
      "commercial": 71,
      "hospital": 78
    }
  },
  {
    "regionCode": "1159010500",
    "regionName": "흑석동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.96235,
      37.50549
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1428,
    "facilityScores": {
      "subway": 69,
      "jobs": 84,
      "school": 88,
      "commercial": 65,
      "hospital": 77
    }
  },
  {
    "regionCode": "1159010600",
    "regionName": "동작동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.97388,
      37.4992
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1083,
    "facilityScores": {
      "subway": 84,
      "jobs": 76,
      "school": 80,
      "commercial": 68,
      "hospital": 78
    }
  },
  {
    "regionCode": "1159010700",
    "regionName": "사당동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.97231,
      37.48561
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1431,
    "facilityScores": {
      "subway": 79,
      "jobs": 76,
      "school": 82,
      "commercial": 77,
      "hospital": 66
    }
  },
  {
    "regionCode": "1159010800",
    "regionName": "대방동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.92799,
      37.50689
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1476,
    "facilityScores": {
      "subway": 69,
      "jobs": 76,
      "school": 66,
      "commercial": 84,
      "hospital": 64
    }
  },
  {
    "regionCode": "1159010900",
    "regionName": "신대방동",
    "sido": "서울특별시",
    "sggCode": "11590",
    "sggName": "동작구",
    "centroid": [
      126.91722,
      37.4927
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1406,
    "facilityScores": {
      "subway": 65,
      "jobs": 64,
      "school": 81,
      "commercial": 84,
      "hospital": 79
    }
  },
  {
    "regionCode": "1162010100",
    "regionName": "봉천동",
    "sido": "서울특별시",
    "sggCode": "11620",
    "sggName": "관악구",
    "centroid": [
      126.95349,
      37.47798
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 905,
    "facilityScores": {
      "subway": 65,
      "jobs": 66,
      "school": 69,
      "commercial": 65,
      "hospital": 65
    }
  },
  {
    "regionCode": "1162010200",
    "regionName": "신림동",
    "sido": "서울특별시",
    "sggCode": "11620",
    "sggName": "관악구",
    "centroid": [
      126.93582,
      37.46318
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 783,
    "facilityScores": {
      "subway": 75,
      "jobs": 64,
      "school": 73,
      "commercial": 55,
      "hospital": 73
    }
  },
  {
    "regionCode": "1162010300",
    "regionName": "남현동",
    "sido": "서울특별시",
    "sggCode": "11620",
    "sggName": "관악구",
    "centroid": [
      126.97776,
      37.46411
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 1024,
    "facilityScores": {
      "subway": 72,
      "jobs": 52,
      "school": 56,
      "commercial": 59,
      "hospital": 72
    }
  },
  {
    "regionCode": "1165010100",
    "regionName": "방배동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      126.99313,
      37.47953
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2024,
    "facilityScores": {
      "subway": 85,
      "jobs": 89,
      "school": 74,
      "commercial": 90,
      "hospital": 96
    }
  },
  {
    "regionCode": "1165010200",
    "regionName": "양재동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.03743,
      37.47198
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1459,
    "facilityScores": {
      "subway": 89,
      "jobs": 74,
      "school": 75,
      "commercial": 76,
      "hospital": 81
    }
  },
  {
    "regionCode": "1165010300",
    "regionName": "우면동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.01794,
      37.46594
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2013,
    "facilityScores": {
      "subway": 79,
      "jobs": 81,
      "school": 98,
      "commercial": 91,
      "hospital": 98
    }
  },
  {
    "regionCode": "1165010400",
    "regionName": "원지동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.04862,
      37.44333
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1934,
    "facilityScores": {
      "subway": 87,
      "jobs": 98,
      "school": 83,
      "commercial": 74,
      "hospital": 89
    }
  },
  {
    "regionCode": "1165010600",
    "regionName": "잠원동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.00907,
      37.5151
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2186,
    "facilityScores": {
      "subway": 87,
      "jobs": 89,
      "school": 96,
      "commercial": 76,
      "hospital": 99
    }
  },
  {
    "regionCode": "1165010700",
    "regionName": "반포동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.00076,
      37.50397
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1736,
    "facilityScores": {
      "subway": 97,
      "jobs": 73,
      "school": 87,
      "commercial": 85,
      "hospital": 76
    }
  },
  {
    "regionCode": "1165010800",
    "regionName": "서초동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.01681,
      37.48837
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2073,
    "facilityScores": {
      "subway": 86,
      "jobs": 83,
      "school": 96,
      "commercial": 74,
      "hospital": 76
    }
  },
  {
    "regionCode": "1165010900",
    "regionName": "내곡동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.07675,
      37.45816
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1636,
    "facilityScores": {
      "subway": 73,
      "jobs": 80,
      "school": 88,
      "commercial": 82,
      "hospital": 85
    }
  },
  {
    "regionCode": "1165011000",
    "regionName": "염곡동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.05367,
      37.46367
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1901,
    "facilityScores": {
      "subway": 98,
      "jobs": 93,
      "school": 81,
      "commercial": 86,
      "hospital": 89
    }
  },
  {
    "regionCode": "1165011100",
    "regionName": "신원동",
    "sido": "서울특별시",
    "sggCode": "11650",
    "sggName": "서초구",
    "centroid": [
      127.06216,
      37.44409
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1765,
    "facilityScores": {
      "subway": 80,
      "jobs": 88,
      "school": 96,
      "commercial": 87,
      "hospital": 86
    }
  },
  {
    "regionCode": "1168010100",
    "regionName": "역삼동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.03853,
      37.50007
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1481,
    "facilityScores": {
      "subway": 76,
      "jobs": 87,
      "school": 78,
      "commercial": 80,
      "hospital": 78
    }
  },
  {
    "regionCode": "1168010300",
    "regionName": "개포동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.06261,
      37.48029
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2015,
    "facilityScores": {
      "subway": 84,
      "jobs": 95,
      "school": 79,
      "commercial": 95,
      "hospital": 84
    }
  },
  {
    "regionCode": "1168010400",
    "regionName": "청담동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.05044,
      37.52437
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1459,
    "facilityScores": {
      "subway": 97,
      "jobs": 93,
      "school": 84,
      "commercial": 83,
      "hospital": 96
    }
  },
  {
    "regionCode": "1168010500",
    "regionName": "삼성동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.05613,
      37.51397
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1896,
    "facilityScores": {
      "subway": 92,
      "jobs": 91,
      "school": 94,
      "commercial": 88,
      "hospital": 93
    }
  },
  {
    "regionCode": "1168010600",
    "regionName": "대치동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.06333,
      37.49919
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2138,
    "facilityScores": {
      "subway": 88,
      "jobs": 75,
      "school": 91,
      "commercial": 76,
      "hospital": 97
    }
  },
  {
    "regionCode": "1168010700",
    "regionName": "신사동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.02912,
      37.52334
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1738,
    "facilityScores": {
      "subway": 83,
      "jobs": 98,
      "school": 89,
      "commercial": 78,
      "hospital": 94
    }
  },
  {
    "regionCode": "1168010800",
    "regionName": "논현동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.03172,
      37.51367
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1821,
    "facilityScores": {
      "subway": 74,
      "jobs": 82,
      "school": 86,
      "commercial": 76,
      "hospital": 94
    }
  },
  {
    "regionCode": "1168011000",
    "regionName": "압구정동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.02846,
      37.53071
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1886,
    "facilityScores": {
      "subway": 93,
      "jobs": 92,
      "school": 94,
      "commercial": 76,
      "hospital": 92
    }
  },
  {
    "regionCode": "1168011100",
    "regionName": "세곡동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.10461,
      37.46437
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1911,
    "facilityScores": {
      "subway": 89,
      "jobs": 84,
      "school": 93,
      "commercial": 86,
      "hospital": 96
    }
  },
  {
    "regionCode": "1168011200",
    "regionName": "자곡동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.10036,
      37.47627
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2014,
    "facilityScores": {
      "subway": 78,
      "jobs": 92,
      "school": 91,
      "commercial": 90,
      "hospital": 92
    }
  },
  {
    "regionCode": "1168011300",
    "regionName": "율현동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.11208,
      37.47082
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1919,
    "facilityScores": {
      "subway": 79,
      "jobs": 79,
      "school": 77,
      "commercial": 74,
      "hospital": 74
    }
  },
  {
    "regionCode": "1168011400",
    "regionName": "일원동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.08286,
      37.48803
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1902,
    "facilityScores": {
      "subway": 93,
      "jobs": 98,
      "school": 97,
      "commercial": 81,
      "hospital": 95
    }
  },
  {
    "regionCode": "1168011500",
    "regionName": "수서동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.09673,
      37.48587
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2184,
    "facilityScores": {
      "subway": 98,
      "jobs": 97,
      "school": 75,
      "commercial": 94,
      "hospital": 92
    }
  },
  {
    "regionCode": "1168011800",
    "regionName": "도곡동",
    "sido": "서울특별시",
    "sggCode": "11680",
    "sggName": "강남구",
    "centroid": [
      127.0453,
      37.48861
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1639,
    "facilityScores": {
      "subway": 75,
      "jobs": 98,
      "school": 88,
      "commercial": 75,
      "hospital": 94
    }
  },
  {
    "regionCode": "1171010100",
    "regionName": "잠실동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.08337,
      37.51198
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2180,
    "facilityScores": {
      "subway": 97,
      "jobs": 84,
      "school": 83,
      "commercial": 87,
      "hospital": 99
    }
  },
  {
    "regionCode": "1171010200",
    "regionName": "신천동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.09904,
      37.52391
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1872,
    "facilityScores": {
      "subway": 85,
      "jobs": 79,
      "school": 91,
      "commercial": 95,
      "hospital": 97
    }
  },
  {
    "regionCode": "1171010300",
    "regionName": "풍납동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.11403,
      37.53324
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1853,
    "facilityScores": {
      "subway": 87,
      "jobs": 84,
      "school": 80,
      "commercial": 93,
      "hospital": 77
    }
  },
  {
    "regionCode": "1171010400",
    "regionName": "송파동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.1135,
      37.50512
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2150,
    "facilityScores": {
      "subway": 83,
      "jobs": 78,
      "school": 77,
      "commercial": 75,
      "hospital": 77
    }
  },
  {
    "regionCode": "1171010500",
    "regionName": "석촌동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.10251,
      37.50276
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2138,
    "facilityScores": {
      "subway": 90,
      "jobs": 87,
      "school": 97,
      "commercial": 79,
      "hospital": 96
    }
  },
  {
    "regionCode": "1171010600",
    "regionName": "삼전동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.09192,
      37.50193
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1451,
    "facilityScores": {
      "subway": 81,
      "jobs": 89,
      "school": 96,
      "commercial": 98,
      "hospital": 83
    }
  },
  {
    "regionCode": "1171010700",
    "regionName": "가락동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.11838,
      37.49568
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1905,
    "facilityScores": {
      "subway": 98,
      "jobs": 87,
      "school": 76,
      "commercial": 91,
      "hospital": 91
    }
  },
  {
    "regionCode": "1171010800",
    "regionName": "문정동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.12254,
      37.48583
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1843,
    "facilityScores": {
      "subway": 76,
      "jobs": 89,
      "school": 83,
      "commercial": 78,
      "hospital": 92
    }
  },
  {
    "regionCode": "1171010900",
    "regionName": "장지동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.13189,
      37.47734
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1898,
    "facilityScores": {
      "subway": 89,
      "jobs": 74,
      "school": 91,
      "commercial": 94,
      "hospital": 77
    }
  },
  {
    "regionCode": "1171011100",
    "regionName": "방이동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.1254,
      37.51565
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1550,
    "facilityScores": {
      "subway": 79,
      "jobs": 80,
      "school": 91,
      "commercial": 96,
      "hospital": 78
    }
  },
  {
    "regionCode": "1171011200",
    "regionName": "오금동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.13399,
      37.50404
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1754,
    "facilityScores": {
      "subway": 79,
      "jobs": 83,
      "school": 97,
      "commercial": 79,
      "hospital": 94
    }
  },
  {
    "regionCode": "1171011300",
    "regionName": "거여동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.14567,
      37.48956
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2044,
    "facilityScores": {
      "subway": 92,
      "jobs": 84,
      "school": 82,
      "commercial": 82,
      "hospital": 83
    }
  },
  {
    "regionCode": "1171011400",
    "regionName": "마천동",
    "sido": "서울특별시",
    "sggCode": "11710",
    "sggName": "송파구",
    "centroid": [
      127.15278,
      37.49845
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2096,
    "facilityScores": {
      "subway": 79,
      "jobs": 80,
      "school": 94,
      "commercial": 84,
      "hospital": 93
    }
  },
  {
    "regionCode": "1174010100",
    "regionName": "명일동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.15084,
      37.54904
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1347,
    "facilityScores": {
      "subway": 78,
      "jobs": 68,
      "school": 73,
      "commercial": 72,
      "hospital": 69
    }
  },
  {
    "regionCode": "1174010200",
    "regionName": "고덕동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.15748,
      37.56363
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1128,
    "facilityScores": {
      "subway": 81,
      "jobs": 75,
      "school": 84,
      "commercial": 63,
      "hospital": 83
    }
  },
  {
    "regionCode": "1174010300",
    "regionName": "상일동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.16885,
      37.55058
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1155,
    "facilityScores": {
      "subway": 73,
      "jobs": 71,
      "school": 80,
      "commercial": 86,
      "hospital": 72
    }
  },
  {
    "regionCode": "1174010500",
    "regionName": "길동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.14598,
      37.53964
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1149,
    "facilityScores": {
      "subway": 76,
      "jobs": 64,
      "school": 81,
      "commercial": 72,
      "hospital": 85
    }
  },
  {
    "regionCode": "1174010600",
    "regionName": "둔촌동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.14471,
      37.52828
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1413,
    "facilityScores": {
      "subway": 82,
      "jobs": 63,
      "school": 71,
      "commercial": 81,
      "hospital": 83
    }
  },
  {
    "regionCode": "1174010700",
    "regionName": "암사동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.13105,
      37.55779
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1482,
    "facilityScores": {
      "subway": 85,
      "jobs": 63,
      "school": 71,
      "commercial": 77,
      "hospital": 69
    }
  },
  {
    "regionCode": "1174010800",
    "regionName": "성내동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.12899,
      37.53049
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1487,
    "facilityScores": {
      "subway": 65,
      "jobs": 64,
      "school": 71,
      "commercial": 89,
      "hospital": 77
    }
  },
  {
    "regionCode": "1174010900",
    "regionName": "천호동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.12765,
      37.54437
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1375,
    "facilityScores": {
      "subway": 75,
      "jobs": 65,
      "school": 79,
      "commercial": 83,
      "hospital": 66
    }
  },
  {
    "regionCode": "1174011000",
    "regionName": "강일동",
    "sido": "서울특별시",
    "sggCode": "11740",
    "sggName": "강동구",
    "centroid": [
      127.17335,
      37.56748
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1356,
    "facilityScores": {
      "subway": 75,
      "jobs": 75,
      "school": 79,
      "commercial": 83,
      "hospital": 68
    }
  }
];

export const SEOUL_REGIONS_META_MAP: Record<string, RegionMeta> = Object.fromEntries(
  SEOUL_REGIONS_META.map((r) => [r.regionCode, r]),
);

export const SEOUL_JOB_FLOW_LINKS: FacilityHubLink[] = [
  // GBD (역삼·삼성) 유입
  { fromCode: '1135010500', toCode: '1168010100', strength: 0.9 }, // 노원 상계 -> 강남 역삼
  { fromCode: '1174010200', toCode: '1168010500', strength: 0.95 }, // 강동 고덕 -> 강남 삼성
  { fromCode: '1171010100', toCode: '1168010500', strength: 0.92 }, // 송파 잠실 -> 강남 삼성
  { fromCode: '1121510500', toCode: '1168010500', strength: 0.85 }, // 광진 자양 -> 강남 삼성
  { fromCode: '1162010100', toCode: '1168010100', strength: 0.88 }, // 관악 봉천 -> 강남 역삼
  { fromCode: '1159010500', toCode: '1165010700', strength: 0.85 }, // 동작 흑석 -> 서초 반포
  // YBD (여의도) & 가산 유입
  { fromCode: '1147010200', toCode: '1156011000', strength: 0.92 }, // 양천 목동 -> 영등포 여의도
  { fromCode: '1150010500', toCode: '1156011000', strength: 0.88 }, // 강서 마곡 -> 영등포 여의도
  { fromCode: '1153010200', toCode: '1154510100', strength: 0.85 }, // 구로 구로 -> 금천 가산
  { fromCode: '1144010200', toCode: '1156011000', strength: 0.86 }, // 마포 공덕 -> 영등포 여의도
  // CBD (종로·중구) 유입
  { fromCode: '1138011400', toCode: '1111011900', strength: 0.86 }, // 은평 진관 -> 종로 세종로
  { fromCode: '1129013400', toCode: '1111011900', strength: 0.84 }, // 성북 길음 -> 종로 세종로
  { fromCode: '1123010700', toCode: '1114012600', strength: 0.82 }, // 동대문 청량리 -> 중구 명동1가
  { fromCode: '1132010700', toCode: '1111011900', strength: 0.8 }, // 도봉 창동 -> 종로 세종로
];

export const SEOUL_TRANSIT_CORRIDORS: TransitCorridor[] = [
  {
    id: 'seoul-line1-incheon',
    name: '서울 1호선 본선·경인선 (망월사→도봉→종로→구로→온수→역곡)',
    color: '#3b82f6',
    startLngLat: [127.0474, 37.7099], // 경기 의정부 망월사역 (도봉산 +1정거장)
    endLngLat: [126.8115, 37.4852], // 인천/부천 방면 역곡역 (온수 +1정거장)
    regionCodes: [
      '1132010800',
      '1132010700',
      '1135010200',
      '1123011000',
      '1123010700',
      '1111016300',
      '1111012600',
      '1114011800',
      '1117012500',
      '1159010100',
      '1156010100',
      '1153010100',
      '1153010200',
      '1153010700',
      '1153010800',
      '1153011000',
    ],
  },
  {
    id: 'seoul-line1-gyeongbu',
    name: '서울 1호선 경부선 (구로→가산→독산→시흥→석수)',
    color: '#3b82f6',
    endLngLat: [126.9023, 37.4351], // 경기 안양 석수역 (금천구청 +1정거장)
    regionCodes: ['1153010200', '1154510100', '1154510200', '1154510300'],
  },
  {
    id: 'seoul-line2-south',
    name: '서울 2호선 순환·강남 축',
    color: '#38bdf8',
    regionCodes: ['1144012000', '1156011000', '1153010200', '1162010100', '1165010800', '1168010100', '1168010500', '1171010100', '1121510500', '1120011400'],
  },
  {
    id: 'seoul-line9-hangang',
    name: '서울 9호선 한강 골드라인',
    color: '#22d3ee',
    regionCodes: ['1150010500', '1147010200', '1156011000', '1159010500', '1165010700', '1168010500', '1171010100', '1174010200'],
  },
  {
    id: 'seoul-north-south',
    name: '강북·도심·용산·강남 남북 축',
    color: '#60a5fa',
    regionCodes: ['1135010500', '1132010700', '1129013400', '1111011900', '1117013100', '1168011000', '1168010100', '1168010600'],
  },
  {
    id: 'seoul-west-east',
    name: '마포·도심·성수·청량리 동서 축',
    color: '#67e8f9',
    regionCodes: ['1144012000', '1144010200', '1111011900', '1114012600', '1120011400', '1123010700'],
  },
];
