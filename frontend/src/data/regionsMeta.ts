import type { FacilityHubLink, FacilityKey, RegionMeta, TransitCorridor } from '../types/dashboard';

export const FACILITY_META: Record<
  FacilityKey,
  { label: string; shortLabel: string; color: string; description: string }
> = {
  jobs: {
    label: '일자리·업무지구',
    shortLabel: '일자리',
    color: '#f59e0b',
    description: '핵심 업무지구(GBD·YBD·판교·지방산단)로의 직주근접 에너지 유입',
  },
  subway: {
    label: '지하철·광역철도',
    shortLabel: '지하철',
    color: '#38bdf8',
    description: '수도권 GTX·지하철 및 광역시 핵심 철도축 접근성 펄스',
  },
  school: {
    label: '학군·교육인프라',
    shortLabel: '학교',
    color: '#a855f7',
    description: '명문 학군지 및 학원가 밀집 지역 파동 영향력',
  },
  commercial: {
    label: '대형상권·생활편의',
    shortLabel: '상권',
    color: '#ec4899',
    description: '핵심 상권·백화점·복합쇼핑몰 집객 파동',
  },
  hospital: {
    label: '상급종합병원',
    shortLabel: '병원',
    color: '#10b981',
    description: '권역 상급종합병원 및 의료 인프라 접근성',
  },
};

export const REGIONS_META: RegionMeta[] = [
  {
    "regionCode": "11010",
    "regionName": "종로구",
    "sido": "서울특별시",
    "centroid": [
      126.9773,
      37.5949
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1047,
    "facilityScores": {
      "subway": 88,
      "jobs": 91,
      "school": 74,
      "commercial": 79,
      "hospital": 99
    }
  },
  {
    "regionCode": "11020",
    "regionName": "중구",
    "sido": "서울특별시",
    "centroid": [
      126.9958,
      37.5601
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1114,
    "facilityScores": {
      "subway": 94,
      "jobs": 99,
      "school": 85,
      "commercial": 89,
      "hospital": 81
    }
  },
  {
    "regionCode": "11030",
    "regionName": "용산구",
    "sido": "서울특별시",
    "centroid": [
      126.9799,
      37.5313
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1843,
    "facilityScores": {
      "subway": 99,
      "jobs": 93,
      "school": 85,
      "commercial": 96,
      "hospital": 92
    }
  },
  {
    "regionCode": "11040",
    "regionName": "성동구",
    "sido": "서울특별시",
    "centroid": [
      127.041,
      37.551
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1596,
    "facilityScores": {
      "subway": 99,
      "jobs": 92,
      "school": 86,
      "commercial": 95,
      "hospital": 98
    }
  },
  {
    "regionCode": "11050",
    "regionName": "광진구",
    "sido": "서울특별시",
    "centroid": [
      127.0858,
      37.5468
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1158,
    "facilityScores": {
      "subway": 90,
      "jobs": 76,
      "school": 80,
      "commercial": 83,
      "hospital": 79
    }
  },
  {
    "regionCode": "11060",
    "regionName": "동대문구",
    "sido": "서울특별시",
    "centroid": [
      127.0549,
      37.582
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 987,
    "facilityScores": {
      "subway": 90,
      "jobs": 75,
      "school": 77,
      "commercial": 78,
      "hospital": 80
    }
  },
  {
    "regionCode": "11070",
    "regionName": "중랑구",
    "sido": "서울특별시",
    "centroid": [
      127.0928,
      37.5978
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 576,
    "facilityScores": {
      "subway": 70,
      "jobs": 66,
      "school": 66,
      "commercial": 70,
      "hospital": 64
    }
  },
  {
    "regionCode": "11080",
    "regionName": "성북구",
    "sido": "서울특별시",
    "centroid": [
      127.0174,
      37.6057
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1077,
    "facilityScores": {
      "subway": 99,
      "jobs": 77,
      "school": 79,
      "commercial": 81,
      "hospital": 89
    }
  },
  {
    "regionCode": "11090",
    "regionName": "강북구",
    "sido": "서울특별시",
    "centroid": [
      127.0112,
      37.6434
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 547,
    "facilityScores": {
      "subway": 62,
      "jobs": 52,
      "school": 68,
      "commercial": 58,
      "hospital": 68
    }
  },
  {
    "regionCode": "11100",
    "regionName": "도봉구",
    "sido": "서울특별시",
    "centroid": [
      127.0324,
      37.6692
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 506,
    "facilityScores": {
      "subway": 65,
      "jobs": 66,
      "school": 70,
      "commercial": 58,
      "hospital": 69
    }
  },
  {
    "regionCode": "11110",
    "regionName": "노원구",
    "sido": "서울특별시",
    "centroid": [
      127.0751,
      37.6524
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 591,
    "facilityScores": {
      "subway": 75,
      "jobs": 54,
      "school": 82,
      "commercial": 63,
      "hospital": 72
    }
  },
  {
    "regionCode": "11120",
    "regionName": "은평구",
    "sido": "서울특별시",
    "centroid": [
      126.927,
      37.6192
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 496,
    "facilityScores": {
      "subway": 70,
      "jobs": 59,
      "school": 68,
      "commercial": 63,
      "hospital": 72
    }
  },
  {
    "regionCode": "11130",
    "regionName": "서대문구",
    "sido": "서울특별시",
    "centroid": [
      126.939,
      37.5778
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1162,
    "facilityScores": {
      "subway": 90,
      "jobs": 86,
      "school": 82,
      "commercial": 79,
      "hospital": 99
    }
  },
  {
    "regionCode": "11140",
    "regionName": "마포구",
    "sido": "서울특별시",
    "centroid": [
      126.9083,
      37.5593
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1096,
    "facilityScores": {
      "subway": 88,
      "jobs": 74,
      "school": 77,
      "commercial": 99,
      "hospital": 92
    }
  },
  {
    "regionCode": "11150",
    "regionName": "양천구",
    "sido": "서울특별시",
    "centroid": [
      126.8555,
      37.5248
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1168,
    "facilityScores": {
      "subway": 98,
      "jobs": 79,
      "school": 89,
      "commercial": 78,
      "hospital": 77
    }
  },
  {
    "regionCode": "11160",
    "regionName": "강서구",
    "sido": "서울특별시",
    "centroid": [
      126.8227,
      37.5612
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1102,
    "facilityScores": {
      "subway": 97,
      "jobs": 83,
      "school": 84,
      "commercial": 83,
      "hospital": 87
    }
  },
  {
    "regionCode": "11170",
    "regionName": "구로구",
    "sido": "서울특별시",
    "centroid": [
      126.8565,
      37.4944
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 517,
    "facilityScores": {
      "subway": 69,
      "jobs": 64,
      "school": 57,
      "commercial": 65,
      "hospital": 63
    }
  },
  {
    "regionCode": "11180",
    "regionName": "금천구",
    "sido": "서울특별시",
    "centroid": [
      126.9009,
      37.4605
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 603,
    "facilityScores": {
      "subway": 64,
      "jobs": 66,
      "school": 66,
      "commercial": 61,
      "hospital": 65
    }
  },
  {
    "regionCode": "11190",
    "regionName": "영등포구",
    "sido": "서울특별시",
    "centroid": [
      126.9101,
      37.5223
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1015,
    "facilityScores": {
      "subway": 87,
      "jobs": 99,
      "school": 84,
      "commercial": 81,
      "hospital": 95
    }
  },
  {
    "regionCode": "11200",
    "regionName": "동작구",
    "sido": "서울특별시",
    "centroid": [
      126.9518,
      37.4988
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 1033,
    "facilityScores": {
      "subway": 85,
      "jobs": 74,
      "school": 72,
      "commercial": 81,
      "hospital": 83
    }
  },
  {
    "regionCode": "11210",
    "regionName": "관악구",
    "sido": "서울특별시",
    "centroid": [
      126.9454,
      37.4673
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 550,
    "facilityScores": {
      "subway": 62,
      "jobs": 53,
      "school": 68,
      "commercial": 58,
      "hospital": 67
    }
  },
  {
    "regionCode": "11220",
    "regionName": "서초구",
    "sido": "서울특별시",
    "centroid": [
      127.0313,
      37.4733
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1838,
    "facilityScores": {
      "subway": 96,
      "jobs": 99,
      "school": 99,
      "commercial": 99,
      "hospital": 99
    }
  },
  {
    "regionCode": "11230",
    "regionName": "강남구",
    "sido": "서울특별시",
    "centroid": [
      127.0629,
      37.4967
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 2085,
    "facilityScores": {
      "subway": 95,
      "jobs": 99,
      "school": 99,
      "commercial": 99,
      "hospital": 99
    }
  },
  {
    "regionCode": "11240",
    "regionName": "송파구",
    "sido": "서울특별시",
    "centroid": [
      127.1152,
      37.5056
    ],
    "tier": "PRIME_SEOUL",
    "basePricePerSqm": 1698,
    "facilityScores": {
      "subway": 92,
      "jobs": 95,
      "school": 84,
      "commercial": 93,
      "hospital": 99
    }
  },
  {
    "regionCode": "11250",
    "regionName": "강동구",
    "sido": "서울특별시",
    "centroid": [
      127.147,
      37.5504
    ],
    "tier": "CORE_SEOUL",
    "basePricePerSqm": 990,
    "facilityScores": {
      "subway": 90,
      "jobs": 87,
      "school": 78,
      "commercial": 81,
      "hospital": 79
    }
  },
  {
    "regionCode": "21010",
    "regionName": "중구",
    "sido": "부산광역시",
    "centroid": [
      129.0321,
      35.1054
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 360,
    "facilityScores": {
      "subway": 60,
      "jobs": 75,
      "school": 66,
      "commercial": 66,
      "hospital": 70
    }
  },
  {
    "regionCode": "21020",
    "regionName": "서구",
    "sido": "부산광역시",
    "centroid": [
      129.015,
      35.1028
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 390,
    "facilityScores": {
      "subway": 70,
      "jobs": 65,
      "school": 70,
      "commercial": 67,
      "hospital": 80
    }
  },
  {
    "regionCode": "21030",
    "regionName": "동구",
    "sido": "부산광역시",
    "centroid": [
      129.0448,
      35.1283
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 367,
    "facilityScores": {
      "subway": 66,
      "jobs": 69,
      "school": 66,
      "commercial": 66,
      "hospital": 61
    }
  },
  {
    "regionCode": "21040",
    "regionName": "영도구",
    "sido": "부산광역시",
    "centroid": [
      129.0647,
      35.0787
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 340,
    "facilityScores": {
      "subway": 65,
      "jobs": 70,
      "school": 69,
      "commercial": 70,
      "hospital": 73
    }
  },
  {
    "regionCode": "21050",
    "regionName": "부산진구",
    "sido": "부산광역시",
    "centroid": [
      129.0431,
      35.1653
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 398,
    "facilityScores": {
      "subway": 61,
      "jobs": 60,
      "school": 68,
      "commercial": 67,
      "hospital": 80
    }
  },
  {
    "regionCode": "21060",
    "regionName": "동래구",
    "sido": "부산광역시",
    "centroid": [
      129.0791,
      35.2062
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 474,
    "facilityScores": {
      "subway": 70,
      "jobs": 72,
      "school": 93,
      "commercial": 83,
      "hospital": 71
    }
  },
  {
    "regionCode": "21070",
    "regionName": "남구",
    "sido": "부산광역시",
    "centroid": [
      129.0945,
      35.1252
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 509,
    "facilityScores": {
      "subway": 80,
      "jobs": 76,
      "school": 88,
      "commercial": 73,
      "hospital": 82
    }
  },
  {
    "regionCode": "21080",
    "regionName": "북구",
    "sido": "부산광역시",
    "centroid": [
      129.0234,
      35.2293
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 399,
    "facilityScores": {
      "subway": 61,
      "jobs": 71,
      "school": 65,
      "commercial": 74,
      "hospital": 72
    }
  },
  {
    "regionCode": "21090",
    "regionName": "해운대구",
    "sido": "부산광역시",
    "centroid": [
      129.1536,
      35.1937
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 661,
    "facilityScores": {
      "subway": 67,
      "jobs": 83,
      "school": 91,
      "commercial": 75,
      "hospital": 76
    }
  },
  {
    "regionCode": "21100",
    "regionName": "사하구",
    "sido": "부산광역시",
    "centroid": [
      128.9704,
      35.0863
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 382,
    "facilityScores": {
      "subway": 69,
      "jobs": 59,
      "school": 62,
      "commercial": 73,
      "hospital": 65
    }
  },
  {
    "regionCode": "21110",
    "regionName": "금정구",
    "sido": "부산광역시",
    "centroid": [
      129.0915,
      35.2589
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 357,
    "facilityScores": {
      "subway": 59,
      "jobs": 71,
      "school": 66,
      "commercial": 64,
      "hospital": 70
    }
  },
  {
    "regionCode": "21120",
    "regionName": "강서구",
    "sido": "부산광역시",
    "centroid": [
      128.8914,
      35.1369
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 336,
    "facilityScores": {
      "subway": 63,
      "jobs": 65,
      "school": 60,
      "commercial": 75,
      "hospital": 74
    }
  },
  {
    "regionCode": "21130",
    "regionName": "연제구",
    "sido": "부산광역시",
    "centroid": [
      129.083,
      35.1824
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 504,
    "facilityScores": {
      "subway": 79,
      "jobs": 71,
      "school": 80,
      "commercial": 85,
      "hospital": 72
    }
  },
  {
    "regionCode": "21140",
    "regionName": "수영구",
    "sido": "부산광역시",
    "centroid": [
      129.1113,
      35.1612
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 483,
    "facilityScores": {
      "subway": 69,
      "jobs": 69,
      "school": 85,
      "commercial": 84,
      "hospital": 73
    }
  },
  {
    "regionCode": "21150",
    "regionName": "사상구",
    "sido": "부산광역시",
    "centroid": [
      128.9866,
      35.158
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 409,
    "facilityScores": {
      "subway": 63,
      "jobs": 69,
      "school": 59,
      "commercial": 68,
      "hospital": 65
    }
  },
  {
    "regionCode": "21310",
    "regionName": "기장군",
    "sido": "부산광역시",
    "centroid": [
      129.201,
      35.2979
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 572,
    "facilityScores": {
      "subway": 59,
      "jobs": 54,
      "school": 60,
      "commercial": 58,
      "hospital": 57
    }
  },
  {
    "regionCode": "22010",
    "regionName": "중구",
    "sido": "대구광역시",
    "centroid": [
      128.5936,
      35.8665
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 482,
    "facilityScores": {
      "subway": 76,
      "jobs": 74,
      "school": 85,
      "commercial": 79,
      "hospital": 85
    }
  },
  {
    "regionCode": "22020",
    "regionName": "동구",
    "sido": "대구광역시",
    "centroid": [
      128.6857,
      35.9345
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 344,
    "facilityScores": {
      "subway": 70,
      "jobs": 67,
      "school": 65,
      "commercial": 63,
      "hospital": 76
    }
  },
  {
    "regionCode": "22030",
    "regionName": "서구",
    "sido": "대구광역시",
    "centroid": [
      128.5497,
      35.8751
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 410,
    "facilityScores": {
      "subway": 60,
      "jobs": 66,
      "school": 69,
      "commercial": 74,
      "hospital": 61
    }
  },
  {
    "regionCode": "22040",
    "regionName": "남구",
    "sido": "대구광역시",
    "centroid": [
      128.5853,
      35.8351
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 380,
    "facilityScores": {
      "subway": 64,
      "jobs": 58,
      "school": 65,
      "commercial": 72,
      "hospital": 63
    }
  },
  {
    "regionCode": "22050",
    "regionName": "북구",
    "sido": "대구광역시",
    "centroid": [
      128.5774,
      35.9289
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 403,
    "facilityScores": {
      "subway": 65,
      "jobs": 69,
      "school": 60,
      "commercial": 68,
      "hospital": 67
    }
  },
  {
    "regionCode": "22060",
    "regionName": "수성구",
    "sido": "대구광역시",
    "centroid": [
      128.6612,
      35.8338
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 602,
    "facilityScores": {
      "subway": 73,
      "jobs": 78,
      "school": 99,
      "commercial": 84,
      "hospital": 81
    }
  },
  {
    "regionCode": "22070",
    "regionName": "달서구",
    "sido": "대구광역시",
    "centroid": [
      128.5289,
      35.8277
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 357,
    "facilityScores": {
      "subway": 67,
      "jobs": 62,
      "school": 61,
      "commercial": 68,
      "hospital": 76
    }
  },
  {
    "regionCode": "22310",
    "regionName": "달성군",
    "sido": "대구광역시",
    "centroid": [
      128.4983,
      35.7596
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 583,
    "facilityScores": {
      "subway": 66,
      "jobs": 59,
      "school": 67,
      "commercial": 66,
      "hospital": 59
    }
  },
  {
    "regionCode": "23010",
    "regionName": "중구",
    "sido": "인천광역시",
    "centroid": [
      126.4822,
      37.4687
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 339,
    "facilityScores": {
      "subway": 58,
      "jobs": 57,
      "school": 63,
      "commercial": 74,
      "hospital": 75
    }
  },
  {
    "regionCode": "23020",
    "regionName": "동구",
    "sido": "인천광역시",
    "centroid": [
      126.6391,
      37.4833
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 398,
    "facilityScores": {
      "subway": 58,
      "jobs": 61,
      "school": 64,
      "commercial": 70,
      "hospital": 69
    }
  },
  {
    "regionCode": "23030",
    "regionName": "미추홀구",
    "sido": "인천광역시",
    "centroid": [
      126.6646,
      37.4525
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 375,
    "facilityScores": {
      "subway": 66,
      "jobs": 58,
      "school": 60,
      "commercial": 71,
      "hospital": 64
    }
  },
  {
    "regionCode": "23040",
    "regionName": "연수구",
    "sido": "인천광역시",
    "centroid": [
      126.6483,
      37.3936
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 494,
    "facilityScores": {
      "subway": 76,
      "jobs": 87,
      "school": 78,
      "commercial": 77,
      "hospital": 84
    }
  },
  {
    "regionCode": "23050",
    "regionName": "남동구",
    "sido": "인천광역시",
    "centroid": [
      126.7265,
      37.4309
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 529,
    "facilityScores": {
      "subway": 72,
      "jobs": 75,
      "school": 74,
      "commercial": 81,
      "hospital": 79
    }
  },
  {
    "regionCode": "23060",
    "regionName": "부평구",
    "sido": "인천광역시",
    "centroid": [
      126.7211,
      37.4966
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 354,
    "facilityScores": {
      "subway": 71,
      "jobs": 69,
      "school": 70,
      "commercial": 71,
      "hospital": 70
    }
  },
  {
    "regionCode": "23070",
    "regionName": "계양구",
    "sido": "인천광역시",
    "centroid": [
      126.7347,
      37.5573
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 412,
    "facilityScores": {
      "subway": 70,
      "jobs": 59,
      "school": 66,
      "commercial": 75,
      "hospital": 63
    }
  },
  {
    "regionCode": "23080",
    "regionName": "서구",
    "sido": "인천광역시",
    "centroid": [
      126.6517,
      37.5596
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 488,
    "facilityScores": {
      "subway": 70,
      "jobs": 70,
      "school": 82,
      "commercial": 85,
      "hospital": 75
    }
  },
  {
    "regionCode": "23310",
    "regionName": "강화군",
    "sido": "인천광역시",
    "centroid": [
      126.4023,
      37.7125
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 516,
    "facilityScores": {
      "subway": 61,
      "jobs": 58,
      "school": 60,
      "commercial": 62,
      "hospital": 64
    }
  },
  {
    "regionCode": "23320",
    "regionName": "옹진군",
    "sido": "인천광역시",
    "centroid": [
      125.6654,
      37.5238
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 591,
    "facilityScores": {
      "subway": 65,
      "jobs": 58,
      "school": 60,
      "commercial": 71,
      "hospital": 71
    }
  },
  {
    "regionCode": "24010",
    "regionName": "동구",
    "sido": "광주광역시",
    "centroid": [
      126.9495,
      35.1174
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 372,
    "facilityScores": {
      "subway": 58,
      "jobs": 61,
      "school": 64,
      "commercial": 66,
      "hospital": 77
    }
  },
  {
    "regionCode": "24020",
    "regionName": "서구",
    "sido": "광주광역시",
    "centroid": [
      126.8506,
      35.1356
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 500,
    "facilityScores": {
      "subway": 68,
      "jobs": 68,
      "school": 83,
      "commercial": 77,
      "hospital": 82
    }
  },
  {
    "regionCode": "24030",
    "regionName": "남구",
    "sido": "광주광역시",
    "centroid": [
      126.8569,
      35.0941
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 532,
    "facilityScores": {
      "subway": 72,
      "jobs": 66,
      "school": 98,
      "commercial": 73,
      "hospital": 79
    }
  },
  {
    "regionCode": "24040",
    "regionName": "북구",
    "sido": "광주광역시",
    "centroid": [
      126.9254,
      35.1932
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 402,
    "facilityScores": {
      "subway": 67,
      "jobs": 70,
      "school": 68,
      "commercial": 71,
      "hospital": 67
    }
  },
  {
    "regionCode": "24050",
    "regionName": "광산구",
    "sido": "광주광역시",
    "centroid": [
      126.7529,
      35.1651
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 343,
    "facilityScores": {
      "subway": 71,
      "jobs": 65,
      "school": 72,
      "commercial": 67,
      "hospital": 72
    }
  },
  {
    "regionCode": "25010",
    "regionName": "동구",
    "sido": "대전광역시",
    "centroid": [
      127.4751,
      36.324
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 387,
    "facilityScores": {
      "subway": 64,
      "jobs": 56,
      "school": 68,
      "commercial": 71,
      "hospital": 70
    }
  },
  {
    "regionCode": "25020",
    "regionName": "중구",
    "sido": "대전광역시",
    "centroid": [
      127.4111,
      36.2808
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 386,
    "facilityScores": {
      "subway": 63,
      "jobs": 57,
      "school": 59,
      "commercial": 75,
      "hospital": 80
    }
  },
  {
    "regionCode": "25030",
    "regionName": "서구",
    "sido": "대전광역시",
    "centroid": [
      127.3452,
      36.2804
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 554,
    "facilityScores": {
      "subway": 69,
      "jobs": 72,
      "school": 99,
      "commercial": 76,
      "hospital": 70
    }
  },
  {
    "regionCode": "25040",
    "regionName": "유성구",
    "sido": "대전광역시",
    "centroid": [
      127.3333,
      36.3767
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 468,
    "facilityScores": {
      "subway": 79,
      "jobs": 94,
      "school": 95,
      "commercial": 78,
      "hospital": 85
    }
  },
  {
    "regionCode": "25050",
    "regionName": "대덕구",
    "sido": "대전광역시",
    "centroid": [
      127.4402,
      36.4124
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 392,
    "facilityScores": {
      "subway": 63,
      "jobs": 55,
      "school": 63,
      "commercial": 70,
      "hospital": 75
    }
  },
  {
    "regionCode": "26010",
    "regionName": "중구",
    "sido": "울산광역시",
    "centroid": [
      129.3082,
      35.5711
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 539,
    "facilityScores": {
      "subway": 81,
      "jobs": 76,
      "school": 87,
      "commercial": 74,
      "hospital": 86
    }
  },
  {
    "regionCode": "26020",
    "regionName": "남구",
    "sido": "울산광역시",
    "centroid": [
      129.3293,
      35.5155
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 581,
    "facilityScores": {
      "subway": 73,
      "jobs": 90,
      "school": 83,
      "commercial": 76,
      "hospital": 71
    }
  },
  {
    "regionCode": "26030",
    "regionName": "동구",
    "sido": "울산광역시",
    "centroid": [
      129.4262,
      35.5255
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 338,
    "facilityScores": {
      "subway": 67,
      "jobs": 58,
      "school": 72,
      "commercial": 62,
      "hospital": 67
    }
  },
  {
    "regionCode": "26040",
    "regionName": "북구",
    "sido": "울산광역시",
    "centroid": [
      129.3799,
      35.6101
    ],
    "tier": "METRO_CITY",
    "basePricePerSqm": 382,
    "facilityScores": {
      "subway": 68,
      "jobs": 64,
      "school": 70,
      "commercial": 73,
      "hospital": 71
    }
  },
  {
    "regionCode": "26310",
    "regionName": "울주군",
    "sido": "울산광역시",
    "centroid": [
      129.1875,
      35.5462
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 582,
    "facilityScores": {
      "subway": 62,
      "jobs": 67,
      "school": 68,
      "commercial": 61,
      "hospital": 69
    }
  },
  {
    "regionCode": "29010",
    "regionName": "세종시",
    "sido": "세종특별자치시",
    "centroid": [
      127.2587,
      36.5606
    ],
    "tier": "METRO_CITY_CORE",
    "basePricePerSqm": 546,
    "facilityScores": {
      "subway": 75,
      "jobs": 77,
      "school": 99,
      "commercial": 80,
      "hospital": 72
    }
  },
  {
    "regionCode": "31010",
    "regionName": "수원시",
    "sido": "경기도",
    "centroid": [
      127.0077,
      37.2804
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 772,
    "facilityScores": {
      "subway": 73,
      "jobs": 79,
      "school": 77,
      "commercial": 79,
      "hospital": 89
    }
  },
  {
    "regionCode": "31020",
    "regionName": "성남시",
    "sido": "경기도",
    "centroid": [
      127.1163,
      37.4074
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 990,
    "facilityScores": {
      "subway": 82,
      "jobs": 99,
      "school": 99,
      "commercial": 75,
      "hospital": 90
    }
  },
  {
    "regionCode": "31030",
    "regionName": "의정부시",
    "sido": "경기도",
    "centroid": [
      127.0684,
      37.7362
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 537,
    "facilityScores": {
      "subway": 59,
      "jobs": 60,
      "school": 70,
      "commercial": 58,
      "hospital": 62
    }
  },
  {
    "regionCode": "31040",
    "regionName": "안양시",
    "sido": "경기도",
    "centroid": [
      126.9279,
      37.4027
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 714,
    "facilityScores": {
      "subway": 74,
      "jobs": 81,
      "school": 99,
      "commercial": 82,
      "hospital": 79
    }
  },
  {
    "regionCode": "31050",
    "regionName": "부천시",
    "sido": "경기도",
    "centroid": [
      126.7888,
      37.5042
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 527,
    "facilityScores": {
      "subway": 65,
      "jobs": 62,
      "school": 61,
      "commercial": 62,
      "hospital": 63
    }
  },
  {
    "regionCode": "31060",
    "regionName": "광명시",
    "sido": "경기도",
    "centroid": [
      126.8647,
      37.4452
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 789,
    "facilityScores": {
      "subway": 75,
      "jobs": 74,
      "school": 79,
      "commercial": 71,
      "hospital": 81
    }
  },
  {
    "regionCode": "31070",
    "regionName": "평택시",
    "sido": "경기도",
    "centroid": [
      126.9935,
      37.0154
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 579,
    "facilityScores": {
      "subway": 66,
      "jobs": 84,
      "school": 66,
      "commercial": 69,
      "hospital": 56
    }
  },
  {
    "regionCode": "31080",
    "regionName": "동두천시",
    "sido": "경기도",
    "centroid": [
      127.078,
      37.9165
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 523,
    "facilityScores": {
      "subway": 64,
      "jobs": 59,
      "school": 71,
      "commercial": 68,
      "hospital": 71
    }
  },
  {
    "regionCode": "31090",
    "regionName": "안산시",
    "sido": "경기도",
    "centroid": [
      126.747,
      37.2909
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 556,
    "facilityScores": {
      "subway": 68,
      "jobs": 54,
      "school": 57,
      "commercial": 64,
      "hospital": 59
    }
  },
  {
    "regionCode": "31100",
    "regionName": "고양시",
    "sido": "경기도",
    "centroid": [
      126.8369,
      37.665
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 800,
    "facilityScores": {
      "subway": 83,
      "jobs": 73,
      "school": 77,
      "commercial": 74,
      "hospital": 83
    }
  },
  {
    "regionCode": "31110",
    "regionName": "과천시",
    "sido": "경기도",
    "centroid": [
      127.0027,
      37.4339
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 1112,
    "facilityScores": {
      "subway": 79,
      "jobs": 78,
      "school": 99,
      "commercial": 79,
      "hospital": 72
    }
  },
  {
    "regionCode": "31120",
    "regionName": "구리시",
    "sido": "경기도",
    "centroid": [
      127.1312,
      37.5992
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 749,
    "facilityScores": {
      "subway": 81,
      "jobs": 72,
      "school": 83,
      "commercial": 83,
      "hospital": 84
    }
  },
  {
    "regionCode": "31130",
    "regionName": "남양주시",
    "sido": "경기도",
    "centroid": [
      127.2436,
      37.6625
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 530,
    "facilityScores": {
      "subway": 66,
      "jobs": 58,
      "school": 62,
      "commercial": 59,
      "hospital": 70
    }
  },
  {
    "regionCode": "31140",
    "regionName": "오산시",
    "sido": "경기도",
    "centroid": [
      127.0512,
      37.1633
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 561,
    "facilityScores": {
      "subway": 63,
      "jobs": 64,
      "school": 59,
      "commercial": 61,
      "hospital": 68
    }
  },
  {
    "regionCode": "31150",
    "regionName": "시흥시",
    "sido": "경기도",
    "centroid": [
      126.7837,
      37.3861
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 552,
    "facilityScores": {
      "subway": 59,
      "jobs": 52,
      "school": 70,
      "commercial": 62,
      "hospital": 64
    }
  },
  {
    "regionCode": "31160",
    "regionName": "군포시",
    "sido": "경기도",
    "centroid": [
      126.9211,
      37.3435
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 509,
    "facilityScores": {
      "subway": 69,
      "jobs": 64,
      "school": 70,
      "commercial": 66,
      "hospital": 59
    }
  },
  {
    "regionCode": "31170",
    "regionName": "의왕시",
    "sido": "경기도",
    "centroid": [
      126.9895,
      37.3623
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 858,
    "facilityScores": {
      "subway": 70,
      "jobs": 71,
      "school": 83,
      "commercial": 77,
      "hospital": 84
    }
  },
  {
    "regionCode": "31180",
    "regionName": "하남시",
    "sido": "경기도",
    "centroid": [
      127.2059,
      37.5228
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 768,
    "facilityScores": {
      "subway": 79,
      "jobs": 76,
      "school": 77,
      "commercial": 85,
      "hospital": 74
    }
  },
  {
    "regionCode": "31190",
    "regionName": "용인시",
    "sido": "경기도",
    "centroid": [
      127.2217,
      37.2215
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 720,
    "facilityScores": {
      "subway": 82,
      "jobs": 75,
      "school": 76,
      "commercial": 74,
      "hospital": 70
    }
  },
  {
    "regionCode": "31200",
    "regionName": "파주시",
    "sido": "경기도",
    "centroid": [
      126.8096,
      37.8555
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 508,
    "facilityScores": {
      "subway": 58,
      "jobs": 54,
      "school": 57,
      "commercial": 63,
      "hospital": 60
    }
  },
  {
    "regionCode": "31210",
    "regionName": "이천시",
    "sido": "경기도",
    "centroid": [
      127.4809,
      37.2099
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 541,
    "facilityScores": {
      "subway": 68,
      "jobs": 65,
      "school": 58,
      "commercial": 59,
      "hospital": 61
    }
  },
  {
    "regionCode": "31220",
    "regionName": "안성시",
    "sido": "경기도",
    "centroid": [
      127.3028,
      37.035
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 550,
    "facilityScores": {
      "subway": 64,
      "jobs": 52,
      "school": 62,
      "commercial": 58,
      "hospital": 67
    }
  },
  {
    "regionCode": "31230",
    "regionName": "김포시",
    "sido": "경기도",
    "centroid": [
      126.6263,
      37.6816
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 842,
    "facilityScores": {
      "subway": 81,
      "jobs": 82,
      "school": 78,
      "commercial": 82,
      "hospital": 84
    }
  },
  {
    "regionCode": "31240",
    "regionName": "화성시",
    "sido": "경기도",
    "centroid": [
      126.8512,
      37.1606
    ],
    "tier": "CORE_GYEONGGI",
    "basePricePerSqm": 719,
    "facilityScores": {
      "subway": 72,
      "jobs": 94,
      "school": 75,
      "commercial": 77,
      "hospital": 85
    }
  },
  {
    "regionCode": "31250",
    "regionName": "광주시",
    "sido": "경기도",
    "centroid": [
      127.3012,
      37.4031
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 531,
    "facilityScores": {
      "subway": 63,
      "jobs": 64,
      "school": 62,
      "commercial": 60,
      "hospital": 63
    }
  },
  {
    "regionCode": "31260",
    "regionName": "양주시",
    "sido": "경기도",
    "centroid": [
      127.0012,
      37.8086
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 581,
    "facilityScores": {
      "subway": 58,
      "jobs": 60,
      "school": 66,
      "commercial": 69,
      "hospital": 58
    }
  },
  {
    "regionCode": "31270",
    "regionName": "포천시",
    "sido": "경기도",
    "centroid": [
      127.2505,
      37.9699
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 496,
    "facilityScores": {
      "subway": 61,
      "jobs": 55,
      "school": 70,
      "commercial": 65,
      "hospital": 63
    }
  },
  {
    "regionCode": "31280",
    "regionName": "여주시",
    "sido": "경기도",
    "centroid": [
      127.6157,
      37.3025
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 529,
    "facilityScores": {
      "subway": 69,
      "jobs": 67,
      "school": 69,
      "commercial": 68,
      "hospital": 57
    }
  },
  {
    "regionCode": "31350",
    "regionName": "연천군",
    "sido": "경기도",
    "centroid": [
      127.0239,
      38.0971
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 554,
    "facilityScores": {
      "subway": 58,
      "jobs": 64,
      "school": 63,
      "commercial": 62,
      "hospital": 67
    }
  },
  {
    "regionCode": "31370",
    "regionName": "가평군",
    "sido": "경기도",
    "centroid": [
      127.4502,
      37.8186
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 589,
    "facilityScores": {
      "subway": 63,
      "jobs": 63,
      "school": 69,
      "commercial": 66,
      "hospital": 67
    }
  },
  {
    "regionCode": "31380",
    "regionName": "양평군",
    "sido": "경기도",
    "centroid": [
      127.5792,
      37.518
    ],
    "tier": "OUTER_METRO",
    "basePricePerSqm": 594,
    "facilityScores": {
      "subway": 59,
      "jobs": 58,
      "school": 60,
      "commercial": 72,
      "hospital": 64
    }
  },
  {
    "regionCode": "32010",
    "regionName": "춘천시",
    "sido": "강원특별자치도",
    "centroid": [
      127.74,
      37.8899
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 351,
    "facilityScores": {
      "subway": 28,
      "jobs": 68,
      "school": 65,
      "commercial": 59,
      "hospital": 63
    }
  },
  {
    "regionCode": "32020",
    "regionName": "원주시",
    "sido": "강원특별자치도",
    "centroid": [
      127.9295,
      37.3083
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 326,
    "facilityScores": {
      "subway": 24,
      "jobs": 63,
      "school": 69,
      "commercial": 73,
      "hospital": 58
    }
  },
  {
    "regionCode": "32030",
    "regionName": "강릉시",
    "sido": "강원특별자치도",
    "centroid": [
      128.8325,
      37.7092
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 306,
    "facilityScores": {
      "subway": 27,
      "jobs": 67,
      "school": 68,
      "commercial": 59,
      "hospital": 70
    }
  },
  {
    "regionCode": "32040",
    "regionName": "동해시",
    "sido": "강원특별자치도",
    "centroid": [
      129.0558,
      37.5069
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 204,
    "facilityScores": {
      "subway": 8,
      "jobs": 35,
      "school": 35,
      "commercial": 33,
      "hospital": 41
    }
  },
  {
    "regionCode": "32050",
    "regionName": "태백시",
    "sido": "강원특별자치도",
    "centroid": [
      128.9801,
      37.1723
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 192,
    "facilityScores": {
      "subway": 8,
      "jobs": 30,
      "school": 46,
      "commercial": 37,
      "hospital": 37
    }
  },
  {
    "regionCode": "32060",
    "regionName": "속초시",
    "sido": "강원특별자치도",
    "centroid": [
      128.5196,
      38.1761
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 192,
    "facilityScores": {
      "subway": 8,
      "jobs": 42,
      "school": 43,
      "commercial": 42,
      "hospital": 42
    }
  },
  {
    "regionCode": "32070",
    "regionName": "삼척시",
    "sido": "강원특별자치도",
    "centroid": [
      129.122,
      37.2775
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 196,
    "facilityScores": {
      "subway": 10,
      "jobs": 31,
      "school": 39,
      "commercial": 46,
      "hospital": 37
    }
  },
  {
    "regionCode": "32310",
    "regionName": "홍천군",
    "sido": "강원특별자치도",
    "centroid": [
      128.0745,
      37.7449
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 196,
    "facilityScores": {
      "subway": 8,
      "jobs": 39,
      "school": 39,
      "commercial": 35,
      "hospital": 38
    }
  },
  {
    "regionCode": "32320",
    "regionName": "횡성군",
    "sido": "강원특별자치도",
    "centroid": [
      128.0771,
      37.509
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 173,
    "facilityScores": {
      "subway": 8,
      "jobs": 34,
      "school": 41,
      "commercial": 44,
      "hospital": 33
    }
  },
  {
    "regionCode": "32330",
    "regionName": "영월군",
    "sido": "강원특별자치도",
    "centroid": [
      128.5002,
      37.2039
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 195,
    "facilityScores": {
      "subway": 8,
      "jobs": 37,
      "school": 45,
      "commercial": 43,
      "hospital": 38
    }
  },
  {
    "regionCode": "32340",
    "regionName": "평창군",
    "sido": "강원특별자치도",
    "centroid": [
      128.4828,
      37.557
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 188,
    "facilityScores": {
      "subway": 8,
      "jobs": 36,
      "school": 46,
      "commercial": 35,
      "hospital": 40
    }
  },
  {
    "regionCode": "32350",
    "regionName": "정선군",
    "sido": "강원특별자치도",
    "centroid": [
      128.739,
      37.3788
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 170,
    "facilityScores": {
      "subway": 9,
      "jobs": 31,
      "school": 35,
      "commercial": 46,
      "hospital": 45
    }
  },
  {
    "regionCode": "32360",
    "regionName": "철원군",
    "sido": "강원특별자치도",
    "centroid": [
      127.4135,
      38.2438
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 202,
    "facilityScores": {
      "subway": 8,
      "jobs": 43,
      "school": 40,
      "commercial": 46,
      "hospital": 39
    }
  },
  {
    "regionCode": "32370",
    "regionName": "화천군",
    "sido": "강원특별자치도",
    "centroid": [
      127.6852,
      38.1384
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 173,
    "facilityScores": {
      "subway": 8,
      "jobs": 38,
      "school": 46,
      "commercial": 39,
      "hospital": 44
    }
  },
  {
    "regionCode": "32380",
    "regionName": "양구군",
    "sido": "강원특별자치도",
    "centroid": [
      128.0012,
      38.1781
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 168,
    "facilityScores": {
      "subway": 8,
      "jobs": 40,
      "school": 38,
      "commercial": 42,
      "hospital": 36
    }
  },
  {
    "regionCode": "32390",
    "regionName": "인제군",
    "sido": "강원특별자치도",
    "centroid": [
      128.2633,
      38.069
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 180,
    "facilityScores": {
      "subway": 8,
      "jobs": 36,
      "school": 42,
      "commercial": 45,
      "hospital": 40
    }
  },
  {
    "regionCode": "32400",
    "regionName": "고성군",
    "sido": "강원특별자치도",
    "centroid": [
      128.3998,
      38.3774
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 179,
    "facilityScores": {
      "subway": 8,
      "jobs": 34,
      "school": 39,
      "commercial": 37,
      "hospital": 35
    }
  },
  {
    "regionCode": "32410",
    "regionName": "양양군",
    "sido": "강원특별자치도",
    "centroid": [
      128.5953,
      38.0046
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 168,
    "facilityScores": {
      "subway": 9,
      "jobs": 40,
      "school": 35,
      "commercial": 42,
      "hospital": 30
    }
  },
  {
    "regionCode": "33020",
    "regionName": "충주시",
    "sido": "충청북도",
    "centroid": [
      127.8955,
      37.0152
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 343,
    "facilityScores": {
      "subway": 36,
      "jobs": 62,
      "school": 63,
      "commercial": 66,
      "hospital": 66
    }
  },
  {
    "regionCode": "33030",
    "regionName": "제천시",
    "sido": "충청북도",
    "centroid": [
      128.1409,
      37.06
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 169,
    "facilityScores": {
      "subway": 16,
      "jobs": 30,
      "school": 35,
      "commercial": 35,
      "hospital": 41
    }
  },
  {
    "regionCode": "33040",
    "regionName": "청주시",
    "sido": "충청북도",
    "centroid": [
      127.4987,
      36.6273
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 300,
    "facilityScores": {
      "subway": 31,
      "jobs": 61,
      "school": 62,
      "commercial": 71,
      "hospital": 60
    }
  },
  {
    "regionCode": "33320",
    "regionName": "보은군",
    "sido": "충청북도",
    "centroid": [
      127.7293,
      36.49
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 169,
    "facilityScores": {
      "subway": 9,
      "jobs": 32,
      "school": 38,
      "commercial": 46,
      "hospital": 43
    }
  },
  {
    "regionCode": "33330",
    "regionName": "옥천군",
    "sido": "충청북도",
    "centroid": [
      127.6566,
      36.3205
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 199,
    "facilityScores": {
      "subway": 19,
      "jobs": 37,
      "school": 34,
      "commercial": 35,
      "hospital": 39
    }
  },
  {
    "regionCode": "33340",
    "regionName": "영동군",
    "sido": "충청북도",
    "centroid": [
      127.8143,
      36.1597
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 185,
    "facilityScores": {
      "subway": 17,
      "jobs": 42,
      "school": 40,
      "commercial": 36,
      "hospital": 34
    }
  },
  {
    "regionCode": "33350",
    "regionName": "진천군",
    "sido": "충청북도",
    "centroid": [
      127.4404,
      36.871
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 173,
    "facilityScores": {
      "subway": 20,
      "jobs": 30,
      "school": 39,
      "commercial": 40,
      "hospital": 33
    }
  },
  {
    "regionCode": "33360",
    "regionName": "괴산군",
    "sido": "충청북도",
    "centroid": [
      127.8296,
      36.7697
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 173,
    "facilityScores": {
      "subway": 8,
      "jobs": 36,
      "school": 34,
      "commercial": 45,
      "hospital": 45
    }
  },
  {
    "regionCode": "33370",
    "regionName": "음성군",
    "sido": "충청북도",
    "centroid": [
      127.6142,
      36.9762
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 196,
    "facilityScores": {
      "subway": 18,
      "jobs": 38,
      "school": 45,
      "commercial": 46,
      "hospital": 40
    }
  },
  {
    "regionCode": "33380",
    "regionName": "단양군",
    "sido": "충청북도",
    "centroid": [
      128.3879,
      36.9945
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 174,
    "facilityScores": {
      "subway": 11,
      "jobs": 38,
      "school": 47,
      "commercial": 32,
      "hospital": 42
    }
  },
  {
    "regionCode": "33390",
    "regionName": "증평군",
    "sido": "충청북도",
    "centroid": [
      127.6046,
      36.7865
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 203,
    "facilityScores": {
      "subway": 15,
      "jobs": 35,
      "school": 43,
      "commercial": 44,
      "hospital": 37
    }
  },
  {
    "regionCode": "34010",
    "regionName": "천안시",
    "sido": "충청남도",
    "centroid": [
      127.2025,
      36.8041
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 309,
    "facilityScores": {
      "subway": 35,
      "jobs": 62,
      "school": 63,
      "commercial": 61,
      "hospital": 61
    }
  },
  {
    "regionCode": "34020",
    "regionName": "공주시",
    "sido": "충청남도",
    "centroid": [
      127.0751,
      36.4799
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 167,
    "facilityScores": {
      "subway": 15,
      "jobs": 38,
      "school": 34,
      "commercial": 43,
      "hospital": 34
    }
  },
  {
    "regionCode": "34030",
    "regionName": "보령시",
    "sido": "충청남도",
    "centroid": [
      126.5908,
      36.3398
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 196,
    "facilityScores": {
      "subway": 19,
      "jobs": 37,
      "school": 33,
      "commercial": 40,
      "hospital": 30
    }
  },
  {
    "regionCode": "34040",
    "regionName": "아산시",
    "sido": "충청남도",
    "centroid": [
      126.9801,
      36.8074
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 333,
    "facilityScores": {
      "subway": 32,
      "jobs": 66,
      "school": 71,
      "commercial": 64,
      "hospital": 67
    }
  },
  {
    "regionCode": "34050",
    "regionName": "서산시",
    "sido": "충청남도",
    "centroid": [
      126.4632,
      36.7847
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 313,
    "facilityScores": {
      "subway": 42,
      "jobs": 70,
      "school": 67,
      "commercial": 69,
      "hospital": 63
    }
  },
  {
    "regionCode": "34060",
    "regionName": "논산시",
    "sido": "충청남도",
    "centroid": [
      127.1577,
      36.1909
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 189,
    "facilityScores": {
      "subway": 10,
      "jobs": 31,
      "school": 44,
      "commercial": 42,
      "hospital": 42
    }
  },
  {
    "regionCode": "34070",
    "regionName": "계룡시",
    "sido": "충청남도",
    "centroid": [
      127.2344,
      36.2917
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 178,
    "facilityScores": {
      "subway": 20,
      "jobs": 35,
      "school": 47,
      "commercial": 39,
      "hospital": 37
    }
  },
  {
    "regionCode": "34080",
    "regionName": "당진시",
    "sido": "충청남도",
    "centroid": [
      126.6521,
      36.9045
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 316,
    "facilityScores": {
      "subway": 36,
      "jobs": 62,
      "school": 72,
      "commercial": 63,
      "hospital": 71
    }
  },
  {
    "regionCode": "34310",
    "regionName": "금산군",
    "sido": "충청남도",
    "centroid": [
      127.4784,
      36.119
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 176,
    "facilityScores": {
      "subway": 15,
      "jobs": 32,
      "school": 40,
      "commercial": 40,
      "hospital": 42
    }
  },
  {
    "regionCode": "34330",
    "regionName": "부여군",
    "sido": "충청남도",
    "centroid": [
      126.857,
      36.2464
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 194,
    "facilityScores": {
      "subway": 16,
      "jobs": 38,
      "school": 40,
      "commercial": 35,
      "hospital": 35
    }
  },
  {
    "regionCode": "34340",
    "regionName": "서천군",
    "sido": "충청남도",
    "centroid": [
      126.7037,
      36.1068
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 195,
    "facilityScores": {
      "subway": 20,
      "jobs": 35,
      "school": 35,
      "commercial": 46,
      "hospital": 36
    }
  },
  {
    "regionCode": "34350",
    "regionName": "청양군",
    "sido": "충청남도",
    "centroid": [
      126.853,
      36.4306
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 180,
    "facilityScores": {
      "subway": 10,
      "jobs": 31,
      "school": 39,
      "commercial": 32,
      "hospital": 38
    }
  },
  {
    "regionCode": "34360",
    "regionName": "홍성군",
    "sido": "충청남도",
    "centroid": [
      126.6257,
      36.5701
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 180,
    "facilityScores": {
      "subway": 20,
      "jobs": 31,
      "school": 41,
      "commercial": 35,
      "hospital": 42
    }
  },
  {
    "regionCode": "34370",
    "regionName": "예산군",
    "sido": "충청남도",
    "centroid": [
      126.7842,
      36.6706
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 192,
    "facilityScores": {
      "subway": 10,
      "jobs": 42,
      "school": 45,
      "commercial": 46,
      "hospital": 40
    }
  },
  {
    "regionCode": "34380",
    "regionName": "태안군",
    "sido": "충청남도",
    "centroid": [
      126.2794,
      36.7075
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 198,
    "facilityScores": {
      "subway": 14,
      "jobs": 36,
      "school": 38,
      "commercial": 42,
      "hospital": 32
    }
  },
  {
    "regionCode": "35010",
    "regionName": "전주시",
    "sido": "전북특별자치도",
    "centroid": [
      127.1158,
      35.8282
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 332,
    "facilityScores": {
      "subway": 32,
      "jobs": 66,
      "school": 59,
      "commercial": 67,
      "hospital": 67
    }
  },
  {
    "regionCode": "35020",
    "regionName": "군산시",
    "sido": "전북특별자치도",
    "centroid": [
      126.7191,
      35.949
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 324,
    "facilityScores": {
      "subway": 36,
      "jobs": 56,
      "school": 59,
      "commercial": 63,
      "hospital": 71
    }
  },
  {
    "regionCode": "35030",
    "regionName": "익산시",
    "sido": "전북특별자치도",
    "centroid": [
      126.9895,
      36.0232
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 343,
    "facilityScores": {
      "subway": 40,
      "jobs": 68,
      "school": 63,
      "commercial": 59,
      "hospital": 60
    }
  },
  {
    "regionCode": "35040",
    "regionName": "정읍시",
    "sido": "전북특별자치도",
    "centroid": [
      126.9059,
      35.6027
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 191,
    "facilityScores": {
      "subway": 17,
      "jobs": 34,
      "school": 43,
      "commercial": 46,
      "hospital": 34
    }
  },
  {
    "regionCode": "35050",
    "regionName": "남원시",
    "sido": "전북특별자치도",
    "centroid": [
      127.442,
      35.4225
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 194,
    "facilityScores": {
      "subway": 8,
      "jobs": 33,
      "school": 33,
      "commercial": 44,
      "hospital": 39
    }
  },
  {
    "regionCode": "35060",
    "regionName": "김제시",
    "sido": "전북특별자치도",
    "centroid": [
      126.8961,
      35.8069
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 184,
    "facilityScores": {
      "subway": 16,
      "jobs": 37,
      "school": 38,
      "commercial": 40,
      "hospital": 36
    }
  },
  {
    "regionCode": "35310",
    "regionName": "완주군",
    "sido": "전북특별자치도",
    "centroid": [
      127.2152,
      35.9188
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 199,
    "facilityScores": {
      "subway": 16,
      "jobs": 40,
      "school": 47,
      "commercial": 42,
      "hospital": 44
    }
  },
  {
    "regionCode": "35320",
    "regionName": "진안군",
    "sido": "전북특별자치도",
    "centroid": [
      127.4301,
      35.8289
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 188,
    "facilityScores": {
      "subway": 20,
      "jobs": 29,
      "school": 38,
      "commercial": 32,
      "hospital": 32
    }
  },
  {
    "regionCode": "35330",
    "regionName": "무주군",
    "sido": "전북특별자치도",
    "centroid": [
      127.713,
      35.9394
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 176,
    "facilityScores": {
      "subway": 10,
      "jobs": 35,
      "school": 37,
      "commercial": 37,
      "hospital": 44
    }
  },
  {
    "regionCode": "35340",
    "regionName": "장수군",
    "sido": "전북특별자치도",
    "centroid": [
      127.5444,
      35.6576
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 173,
    "facilityScores": {
      "subway": 14,
      "jobs": 40,
      "school": 33,
      "commercial": 37,
      "hospital": 38
    }
  },
  {
    "regionCode": "35350",
    "regionName": "임실군",
    "sido": "전북특별자치도",
    "centroid": [
      127.2366,
      35.5982
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 177,
    "facilityScores": {
      "subway": 10,
      "jobs": 28,
      "school": 43,
      "commercial": 43,
      "hospital": 34
    }
  },
  {
    "regionCode": "35360",
    "regionName": "순창군",
    "sido": "전북특별자치도",
    "centroid": [
      127.0901,
      35.4336
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 207,
    "facilityScores": {
      "subway": 15,
      "jobs": 33,
      "school": 39,
      "commercial": 43,
      "hospital": 40
    }
  },
  {
    "regionCode": "35370",
    "regionName": "고창군",
    "sido": "전북특별자치도",
    "centroid": [
      126.6159,
      35.4491
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 174,
    "facilityScores": {
      "subway": 18,
      "jobs": 34,
      "school": 38,
      "commercial": 33,
      "hospital": 43
    }
  },
  {
    "regionCode": "35380",
    "regionName": "부안군",
    "sido": "전북특별자치도",
    "centroid": [
      126.6423,
      35.6776
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 203,
    "facilityScores": {
      "subway": 17,
      "jobs": 36,
      "school": 36,
      "commercial": 38,
      "hospital": 42
    }
  },
  {
    "regionCode": "36010",
    "regionName": "목포시",
    "sido": "전라남도",
    "centroid": [
      126.3905,
      34.8029
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 301,
    "facilityScores": {
      "subway": 31,
      "jobs": 70,
      "school": 67,
      "commercial": 73,
      "hospital": 58
    }
  },
  {
    "regionCode": "36020",
    "regionName": "여수시",
    "sido": "전라남도",
    "centroid": [
      127.6526,
      34.6952
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 300,
    "facilityScores": {
      "subway": 44,
      "jobs": 66,
      "school": 65,
      "commercial": 59,
      "hospital": 59
    }
  },
  {
    "regionCode": "36030",
    "regionName": "순천시",
    "sido": "전라남도",
    "centroid": [
      127.3894,
      34.9945
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 341,
    "facilityScores": {
      "subway": 40,
      "jobs": 71,
      "school": 61,
      "commercial": 64,
      "hospital": 58
    }
  },
  {
    "regionCode": "36040",
    "regionName": "나주시",
    "sido": "전라남도",
    "centroid": [
      126.7204,
      34.9886
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 340,
    "facilityScores": {
      "subway": 39,
      "jobs": 68,
      "school": 66,
      "commercial": 68,
      "hospital": 70
    }
  },
  {
    "regionCode": "36060",
    "regionName": "광양시",
    "sido": "전라남도",
    "centroid": [
      127.6565,
      35.0189
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 294,
    "facilityScores": {
      "subway": 31,
      "jobs": 59,
      "school": 66,
      "commercial": 63,
      "hospital": 61
    }
  },
  {
    "regionCode": "36310",
    "regionName": "담양군",
    "sido": "전라남도",
    "centroid": [
      126.9953,
      35.2915
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 192,
    "facilityScores": {
      "subway": 12,
      "jobs": 41,
      "school": 47,
      "commercial": 44,
      "hospital": 32
    }
  },
  {
    "regionCode": "36320",
    "regionName": "곡성군",
    "sido": "전라남도",
    "centroid": [
      127.2635,
      35.2166
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 204,
    "facilityScores": {
      "subway": 14,
      "jobs": 34,
      "school": 36,
      "commercial": 44,
      "hospital": 44
    }
  },
  {
    "regionCode": "36330",
    "regionName": "구례군",
    "sido": "전라남도",
    "centroid": [
      127.5031,
      35.2368
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 174,
    "facilityScores": {
      "subway": 18,
      "jobs": 41,
      "school": 47,
      "commercial": 45,
      "hospital": 33
    }
  },
  {
    "regionCode": "36350",
    "regionName": "고흥군",
    "sido": "전라남도",
    "centroid": [
      127.3149,
      34.5982
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 178,
    "facilityScores": {
      "subway": 17,
      "jobs": 32,
      "school": 40,
      "commercial": 33,
      "hospital": 43
    }
  },
  {
    "regionCode": "36360",
    "regionName": "보성군",
    "sido": "전라남도",
    "centroid": [
      127.1625,
      34.8143
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 174,
    "facilityScores": {
      "subway": 13,
      "jobs": 35,
      "school": 37,
      "commercial": 42,
      "hospital": 37
    }
  },
  {
    "regionCode": "36370",
    "regionName": "화순군",
    "sido": "전라남도",
    "centroid": [
      127.0335,
      35.0082
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 177,
    "facilityScores": {
      "subway": 14,
      "jobs": 31,
      "school": 41,
      "commercial": 38,
      "hospital": 41
    }
  },
  {
    "regionCode": "36380",
    "regionName": "장흥군",
    "sido": "전라남도",
    "centroid": [
      126.922,
      34.6753
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 188,
    "facilityScores": {
      "subway": 19,
      "jobs": 32,
      "school": 40,
      "commercial": 41,
      "hospital": 34
    }
  },
  {
    "regionCode": "36390",
    "regionName": "강진군",
    "sido": "전라남도",
    "centroid": [
      126.7722,
      34.6203
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 200,
    "facilityScores": {
      "subway": 9,
      "jobs": 44,
      "school": 44,
      "commercial": 37,
      "hospital": 39
    }
  },
  {
    "regionCode": "36400",
    "regionName": "해남군",
    "sido": "전라남도",
    "centroid": [
      126.5114,
      34.5586
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 201,
    "facilityScores": {
      "subway": 11,
      "jobs": 41,
      "school": 33,
      "commercial": 37,
      "hospital": 41
    }
  },
  {
    "regionCode": "36410",
    "regionName": "영암군",
    "sido": "전라남도",
    "centroid": [
      126.6262,
      34.797
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 189,
    "facilityScores": {
      "subway": 8,
      "jobs": 30,
      "school": 44,
      "commercial": 41,
      "hospital": 31
    }
  },
  {
    "regionCode": "36420",
    "regionName": "무안군",
    "sido": "전라남도",
    "centroid": [
      126.4252,
      34.9538
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 200,
    "facilityScores": {
      "subway": 15,
      "jobs": 32,
      "school": 35,
      "commercial": 45,
      "hospital": 42
    }
  },
  {
    "regionCode": "36430",
    "regionName": "함평군",
    "sido": "전라남도",
    "centroid": [
      126.5355,
      35.1127
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 197,
    "facilityScores": {
      "subway": 11,
      "jobs": 37,
      "school": 45,
      "commercial": 35,
      "hospital": 41
    }
  },
  {
    "regionCode": "36440",
    "regionName": "영광군",
    "sido": "전라남도",
    "centroid": [
      126.4506,
      35.279
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 174,
    "facilityScores": {
      "subway": 8,
      "jobs": 37,
      "school": 40,
      "commercial": 36,
      "hospital": 40
    }
  },
  {
    "regionCode": "36450",
    "regionName": "장성군",
    "sido": "전라남도",
    "centroid": [
      126.7686,
      35.3296
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 204,
    "facilityScores": {
      "subway": 14,
      "jobs": 35,
      "school": 36,
      "commercial": 37,
      "hospital": 35
    }
  },
  {
    "regionCode": "36460",
    "regionName": "완도군",
    "sido": "전라남도",
    "centroid": [
      126.7784,
      34.2946
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 197,
    "facilityScores": {
      "subway": 16,
      "jobs": 31,
      "school": 36,
      "commercial": 41,
      "hospital": 31
    }
  },
  {
    "regionCode": "36470",
    "regionName": "진도군",
    "sido": "전라남도",
    "centroid": [
      126.2116,
      34.437
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 186,
    "facilityScores": {
      "subway": 13,
      "jobs": 33,
      "school": 45,
      "commercial": 40,
      "hospital": 42
    }
  },
  {
    "regionCode": "36480",
    "regionName": "신안군",
    "sido": "전라남도",
    "centroid": [
      126.0426,
      34.81
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 193,
    "facilityScores": {
      "subway": 14,
      "jobs": 38,
      "school": 36,
      "commercial": 32,
      "hospital": 32
    }
  },
  {
    "regionCode": "37010",
    "regionName": "포항시",
    "sido": "경상북도",
    "centroid": [
      129.3054,
      36.0929
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 358,
    "facilityScores": {
      "subway": 43,
      "jobs": 79,
      "school": 62,
      "commercial": 61,
      "hospital": 69
    }
  },
  {
    "regionCode": "37020",
    "regionName": "경주시",
    "sido": "경상북도",
    "centroid": [
      129.236,
      35.8266
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 308,
    "facilityScores": {
      "subway": 34,
      "jobs": 62,
      "school": 67,
      "commercial": 65,
      "hospital": 71
    }
  },
  {
    "regionCode": "37030",
    "regionName": "김천시",
    "sido": "경상북도",
    "centroid": [
      128.0778,
      36.0605
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 189,
    "facilityScores": {
      "subway": 14,
      "jobs": 29,
      "school": 37,
      "commercial": 39,
      "hospital": 33
    }
  },
  {
    "regionCode": "37040",
    "regionName": "안동시",
    "sido": "경상북도",
    "centroid": [
      128.78,
      36.5803
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 347,
    "facilityScores": {
      "subway": 43,
      "jobs": 71,
      "school": 66,
      "commercial": 66,
      "hospital": 60
    }
  },
  {
    "regionCode": "37050",
    "regionName": "구미시",
    "sido": "경상북도",
    "centroid": [
      128.3555,
      36.2073
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 333,
    "facilityScores": {
      "subway": 32,
      "jobs": 83,
      "school": 70,
      "commercial": 62,
      "hospital": 58
    }
  },
  {
    "regionCode": "37060",
    "regionName": "영주시",
    "sido": "경상북도",
    "centroid": [
      128.5977,
      36.8706
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 189,
    "facilityScores": {
      "subway": 9,
      "jobs": 32,
      "school": 35,
      "commercial": 33,
      "hospital": 43
    }
  },
  {
    "regionCode": "37070",
    "regionName": "영천시",
    "sido": "경상북도",
    "centroid": [
      128.9426,
      36.0158
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 200,
    "facilityScores": {
      "subway": 13,
      "jobs": 44,
      "school": 47,
      "commercial": 43,
      "hospital": 44
    }
  },
  {
    "regionCode": "37080",
    "regionName": "상주시",
    "sido": "경상북도",
    "centroid": [
      128.067,
      36.4296
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 203,
    "facilityScores": {
      "subway": 17,
      "jobs": 36,
      "school": 38,
      "commercial": 36,
      "hospital": 34
    }
  },
  {
    "regionCode": "37090",
    "regionName": "문경시",
    "sido": "경상북도",
    "centroid": [
      128.1487,
      36.6908
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 174,
    "facilityScores": {
      "subway": 16,
      "jobs": 38,
      "school": 35,
      "commercial": 46,
      "hospital": 39
    }
  },
  {
    "regionCode": "37100",
    "regionName": "경산시",
    "sido": "경상북도",
    "centroid": [
      128.809,
      35.8341
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 311,
    "facilityScores": {
      "subway": 33,
      "jobs": 61,
      "school": 59,
      "commercial": 71,
      "hospital": 68
    }
  },
  {
    "regionCode": "37310",
    "regionName": "군위군",
    "sido": "경상북도",
    "centroid": [
      128.6481,
      36.1701
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 168,
    "facilityScores": {
      "subway": 13,
      "jobs": 40,
      "school": 36,
      "commercial": 38,
      "hospital": 37
    }
  },
  {
    "regionCode": "37320",
    "regionName": "의성군",
    "sido": "경상북도",
    "centroid": [
      128.615,
      36.362
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 167,
    "facilityScores": {
      "subway": 9,
      "jobs": 40,
      "school": 45,
      "commercial": 42,
      "hospital": 35
    }
  },
  {
    "regionCode": "37330",
    "regionName": "청송군",
    "sido": "경상북도",
    "centroid": [
      129.0574,
      36.357
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 171,
    "facilityScores": {
      "subway": 19,
      "jobs": 37,
      "school": 41,
      "commercial": 46,
      "hospital": 31
    }
  },
  {
    "regionCode": "37340",
    "regionName": "영양군",
    "sido": "경상북도",
    "centroid": [
      129.145,
      36.6964
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 182,
    "facilityScores": {
      "subway": 15,
      "jobs": 31,
      "school": 36,
      "commercial": 35,
      "hospital": 29
    }
  },
  {
    "regionCode": "37350",
    "regionName": "영덕군",
    "sido": "경상북도",
    "centroid": [
      129.3177,
      36.4825
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 170,
    "facilityScores": {
      "subway": 9,
      "jobs": 35,
      "school": 34,
      "commercial": 32,
      "hospital": 41
    }
  },
  {
    "regionCode": "37360",
    "regionName": "청도군",
    "sido": "경상북도",
    "centroid": [
      128.7865,
      35.6729
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 204,
    "facilityScores": {
      "subway": 19,
      "jobs": 41,
      "school": 34,
      "commercial": 46,
      "hospital": 36
    }
  },
  {
    "regionCode": "37370",
    "regionName": "고령군",
    "sido": "경상북도",
    "centroid": [
      128.3068,
      35.7372
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 193,
    "facilityScores": {
      "subway": 15,
      "jobs": 42,
      "school": 45,
      "commercial": 35,
      "hospital": 40
    }
  },
  {
    "regionCode": "37380",
    "regionName": "성주군",
    "sido": "경상북도",
    "centroid": [
      128.2333,
      35.9073
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 172,
    "facilityScores": {
      "subway": 14,
      "jobs": 38,
      "school": 40,
      "commercial": 36,
      "hospital": 38
    }
  },
  {
    "regionCode": "37390",
    "regionName": "칠곡군",
    "sido": "경상북도",
    "centroid": [
      128.4625,
      36.0155
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 201,
    "facilityScores": {
      "subway": 10,
      "jobs": 39,
      "school": 35,
      "commercial": 40,
      "hospital": 37
    }
  },
  {
    "regionCode": "37400",
    "regionName": "예천군",
    "sido": "경상북도",
    "centroid": [
      128.4224,
      36.6539
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 190,
    "facilityScores": {
      "subway": 15,
      "jobs": 41,
      "school": 39,
      "commercial": 41,
      "hospital": 43
    }
  },
  {
    "regionCode": "37410",
    "regionName": "봉화군",
    "sido": "경상북도",
    "centroid": [
      128.913,
      36.9342
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 202,
    "facilityScores": {
      "subway": 12,
      "jobs": 37,
      "school": 43,
      "commercial": 44,
      "hospital": 38
    }
  },
  {
    "regionCode": "37420",
    "regionName": "울진군",
    "sido": "경상북도",
    "centroid": [
      129.3124,
      36.9041
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 183,
    "facilityScores": {
      "subway": 12,
      "jobs": 32,
      "school": 42,
      "commercial": 44,
      "hospital": 34
    }
  },
  {
    "regionCode": "37430",
    "regionName": "울릉군",
    "sido": "경상북도",
    "centroid": [
      130.8633,
      37.502
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 175,
    "facilityScores": {
      "subway": 16,
      "jobs": 44,
      "school": 43,
      "commercial": 39,
      "hospital": 39
    }
  },
  {
    "regionCode": "38030",
    "regionName": "진주시",
    "sido": "경상남도",
    "centroid": [
      128.1298,
      35.2052
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 331,
    "facilityScores": {
      "subway": 40,
      "jobs": 57,
      "school": 62,
      "commercial": 62,
      "hospital": 64
    }
  },
  {
    "regionCode": "38050",
    "regionName": "통영시",
    "sido": "경상남도",
    "centroid": [
      128.374,
      34.8253
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 169,
    "facilityScores": {
      "subway": 8,
      "jobs": 35,
      "school": 38,
      "commercial": 34,
      "hospital": 33
    }
  },
  {
    "regionCode": "38060",
    "regionName": "사천시",
    "sido": "경상남도",
    "centroid": [
      128.0374,
      35.0494
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 198,
    "facilityScores": {
      "subway": 12,
      "jobs": 32,
      "school": 33,
      "commercial": 45,
      "hospital": 43
    }
  },
  {
    "regionCode": "38070",
    "regionName": "김해시",
    "sido": "경상남도",
    "centroid": [
      128.8452,
      35.2722
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 337,
    "facilityScores": {
      "subway": 32,
      "jobs": 64,
      "school": 61,
      "commercial": 61,
      "hospital": 69
    }
  },
  {
    "regionCode": "38080",
    "regionName": "밀양시",
    "sido": "경상남도",
    "centroid": [
      128.7897,
      35.4985
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 190,
    "facilityScores": {
      "subway": 14,
      "jobs": 34,
      "school": 47,
      "commercial": 36,
      "hospital": 42
    }
  },
  {
    "regionCode": "38090",
    "regionName": "거제시",
    "sido": "경상남도",
    "centroid": [
      128.6235,
      34.8702
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 323,
    "facilityScores": {
      "subway": 34,
      "jobs": 67,
      "school": 68,
      "commercial": 68,
      "hospital": 72
    }
  },
  {
    "regionCode": "38100",
    "regionName": "양산시",
    "sido": "경상남도",
    "centroid": [
      129.041,
      35.4019
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 348,
    "facilityScores": {
      "subway": 36,
      "jobs": 69,
      "school": 69,
      "commercial": 70,
      "hospital": 70
    }
  },
  {
    "regionCode": "38110",
    "regionName": "창원시",
    "sido": "경상남도",
    "centroid": [
      128.6,
      35.2016
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 297,
    "facilityScores": {
      "subway": 39,
      "jobs": 81,
      "school": 70,
      "commercial": 73,
      "hospital": 58
    }
  },
  {
    "regionCode": "38310",
    "regionName": "의령군",
    "sido": "경상남도",
    "centroid": [
      128.2772,
      35.3924
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 184,
    "facilityScores": {
      "subway": 12,
      "jobs": 36,
      "school": 43,
      "commercial": 33,
      "hospital": 31
    }
  },
  {
    "regionCode": "38320",
    "regionName": "함안군",
    "sido": "경상남도",
    "centroid": [
      128.4309,
      35.291
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 184,
    "facilityScores": {
      "subway": 16,
      "jobs": 42,
      "school": 45,
      "commercial": 44,
      "hospital": 36
    }
  },
  {
    "regionCode": "38330",
    "regionName": "창녕군",
    "sido": "경상남도",
    "centroid": [
      128.4929,
      35.5083
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 196,
    "facilityScores": {
      "subway": 14,
      "jobs": 38,
      "school": 35,
      "commercial": 40,
      "hospital": 40
    }
  },
  {
    "regionCode": "38340",
    "regionName": "고성군",
    "sido": "경상남도",
    "centroid": [
      128.2906,
      35.016
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 169,
    "facilityScores": {
      "subway": 15,
      "jobs": 32,
      "school": 43,
      "commercial": 38,
      "hospital": 41
    }
  },
  {
    "regionCode": "38350",
    "regionName": "남해군",
    "sido": "경상남도",
    "centroid": [
      127.9416,
      34.8179
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 180,
    "facilityScores": {
      "subway": 19,
      "jobs": 44,
      "school": 44,
      "commercial": 34,
      "hospital": 30
    }
  },
  {
    "regionCode": "38360",
    "regionName": "하동군",
    "sido": "경상남도",
    "centroid": [
      127.7792,
      35.1374
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 195,
    "facilityScores": {
      "subway": 9,
      "jobs": 32,
      "school": 40,
      "commercial": 33,
      "hospital": 44
    }
  },
  {
    "regionCode": "38370",
    "regionName": "산청군",
    "sido": "경상남도",
    "centroid": [
      127.8844,
      35.3686
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 207,
    "facilityScores": {
      "subway": 19,
      "jobs": 33,
      "school": 44,
      "commercial": 44,
      "hospital": 41
    }
  },
  {
    "regionCode": "38380",
    "regionName": "함양군",
    "sido": "경상남도",
    "centroid": [
      127.7221,
      35.5517
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 200,
    "facilityScores": {
      "subway": 14,
      "jobs": 44,
      "school": 41,
      "commercial": 35,
      "hospital": 30
    }
  },
  {
    "regionCode": "38390",
    "regionName": "거창군",
    "sido": "경상남도",
    "centroid": [
      127.9041,
      35.7326
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 170,
    "facilityScores": {
      "subway": 15,
      "jobs": 39,
      "school": 33,
      "commercial": 42,
      "hospital": 34
    }
  },
  {
    "regionCode": "38400",
    "regionName": "합천군",
    "sido": "경상남도",
    "centroid": [
      128.1416,
      35.5766
    ],
    "tier": "PROVINCIAL_RURAL",
    "basePricePerSqm": 176,
    "facilityScores": {
      "subway": 8,
      "jobs": 35,
      "school": 33,
      "commercial": 34,
      "hospital": 39
    }
  },
  {
    "regionCode": "39010",
    "regionName": "제주시",
    "sido": "제주특별자치도",
    "centroid": [
      126.5294,
      33.4428
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 307,
    "facilityScores": {
      "subway": 32,
      "jobs": 67,
      "school": 68,
      "commercial": 60,
      "hospital": 64
    }
  },
  {
    "regionCode": "39020",
    "regionName": "서귀포시",
    "sido": "제주특별자치도",
    "centroid": [
      126.5812,
      33.3244
    ],
    "tier": "PROVINCIAL_HUB",
    "basePricePerSqm": 299,
    "facilityScores": {
      "subway": 21,
      "jobs": 64,
      "school": 64,
      "commercial": 69,
      "hospital": 69
    }
  }
];

export const REGIONS_META_MAP: Record<string, RegionMeta> = Object.fromEntries(
  REGIONS_META.map((r) => [r.regionCode, r])
);

// Commuter bed-town -> major employment hub arcs for 3D particle flows
export const JOB_FLOW_LINKS: FacilityHubLink[] = [
  // Capital area -> Gangnam (11230), Yeouido (11190), Pangyo/Seongnam (31020), Jongno/CBD (11010)
  { fromCode: '11110', toCode: '11230', strength: 0.9 }, // 노원 -> 강남
  { fromCode: '11250', toCode: '11230', strength: 0.95 }, // 강동 -> 강남
  { fromCode: '31180', toCode: '11230', strength: 0.9 }, // 하남 -> 강남
  { fromCode: '31130', toCode: '11230', strength: 0.8 }, // 남양주 -> 강남
  { fromCode: '31190', toCode: '31020', strength: 1.0 }, // 용인 -> 성남(판교)
  { fromCode: '31010', toCode: '31020', strength: 0.95 }, // 수원 -> 성남(판교)
  { fromCode: '31240', toCode: '31020', strength: 0.85 }, // 화성 -> 성남(판교)
  { fromCode: '31250', toCode: '31020', strength: 0.8 }, // 광주(경기) -> 성남(판교)
  { fromCode: '31050', toCode: '11190', strength: 0.85 }, // 부천 -> 여의도
  { fromCode: '31060', toCode: '11190', strength: 0.9 }, // 광명 -> 여의도
  { fromCode: '23040', toCode: '11190', strength: 0.75 }, // 인천 연수 -> 여의도
  { fromCode: '31100', toCode: '11010', strength: 0.9 }, // 고양 -> 종로/CBD
  { fromCode: '31200', toCode: '11010', strength: 0.75 }, // 파주 -> 종로/CBD
  { fromCode: '31030', toCode: '11010', strength: 0.75 }, // 의정부 -> 종로/CBD
  { fromCode: '31230', toCode: '11190', strength: 0.8 }, // 김포 -> 여의도
  // Regional hubs
  { fromCode: '38100', toCode: '21090', strength: 0.85 }, // 양산 -> 부산 해운대
  { fromCode: '38070', toCode: '21010', strength: 0.85 }, // 김해 -> 부산 중구
  { fromCode: '21310', toCode: '21090', strength: 0.75 }, // 기장 -> 부산 해운대
  { fromCode: '37100', toCode: '22060', strength: 0.85 }, // 경산 -> 대구 수성
  { fromCode: '22310', toCode: '22060', strength: 0.8 }, // 달성 -> 대구 수성
  { fromCode: '29010', toCode: '25040', strength: 0.9 }, // 세종 -> 대전 유성(대덕)
  { fromCode: '33040', toCode: '25040', strength: 0.75 }, // 청주 -> 대전 유성
  { fromCode: '36370', toCode: '24050', strength: 0.75 }, // 화순 -> 광주 광산
  { fromCode: '38070', toCode: '38110', strength: 0.8 }, // 김해 -> 창원
  { fromCode: '37020', toCode: '26020', strength: 0.75 }, // 경주 -> 울산 남구
];

// Major rail / subway corridors for pulsing 3D light tracks
export const TRANSIT_CORRIDORS: TransitCorridor[] = [
  {
    id: 'gtx-a',
    name: '수도권 GTX-A·신분당 축',
    color: '#38bdf8',
    regionCodes: ['31200', '31100', '11120', '11010', '11030', '11230', '31020', '31190', '31240', '31070'],
  },
  {
    id: 'gtx-b',
    name: '수도권 GTX-B·경인경춘 축',
    color: '#22d3ee',
    regionCodes: ['23040', '23060', '31050', '11190', '11030', '11060', '31120', '31130', '32010'],
  },
  {
    id: 'seoul-spine',
    name: '서울 순환·한강 축',
    color: '#60a5fa',
    regionCodes: ['11160', '11140', '11030', '11040', '11240', '11230', '11220', '11200', '11190'],
  },
  {
    id: 'busan-metro',
    name: '부울경 광역철도 축',
    color: '#38bdf8',
    regionCodes: ['38110', '38070', '21080', '21050', '21130', '21090', '21310', '26020'],
  },
  {
    id: 'chungcheong-axis',
    name: '충청권 광역철도 축',
    color: '#67e8f9',
    regionCodes: ['34010', '33040', '29010', '25040', '25030', '25020'],
  },
  {
    id: 'daegu-axis',
    name: '대경권 철도 축',
    color: '#38bdf8',
    regionCodes: ['37050', '22050', '22010', '22060', '37100'],
  },
  {
    id: 'honam-axis',
    name: '호남권 철도 축',
    color: '#22d3ee',
    regionCodes: ['35030', '35010', '24050', '24020', '24010', '36040'],
  },
];
