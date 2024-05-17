import {
  HEIGHT,
  PURPOSE,
  FEASIBILITYCLASS,
  RARESPP,
  TROUT,
  SALMONID_ESU,
  SALMONID_ESU_COUNT,
  STREAMORDER,
  INTERMITTENT,
  GAINMILES,
  HAZARD,
  CONDITION,
  PASSABILITY,
  YEARCOMPLETED,
  LOWHEAD_DAM,
  WATERBODY_SIZECLASS,
  PERCENT_ALTERED,
  PERCENT_RESILIENT,
  PASSAGEFACILITY_CLASS,
  OWNERTYPE,
  BARRIEROWNERTYPE,
  FERC_REGULATED,
  STATE_REGULATED,
  WATER_RIGHT,
  BOOLEAN_FIELD,
  DOWNSTREAM_OCEAN_MILES,
  DOWNSTREAM_OCEAN_DAMS_DOMAIN,
  DISADVANTAGED_COMMUNITY,
  INVASIVE_NETWORK,
  FISH_HABITAT_PARTNERSHIPS,
} from 'config'

import { getEntries, hasDiadromousData } from './common'

// Each filter needs to have a dimension above that matches the key here
export const dams = [
  {
    id: 'social_benefits',
    title: 'Social Benefits & Partners',
    filters: [
      {
        field: 'feasibilityclass',
        title: 'Feasibility & conservation benefit',
        help: 'Note: feasibility is based on further reconnaissance to evaluate individual barriers. Values are provided only for those that have been evaluated. There may be more feasible or infeasible dams than are indicated above.',
        hideMissingValues: true,
        ...getEntries(FEASIBILITYCLASS, (v) => v > 0),
      },
      {
        field: 'disadvantagedcommunity',
        title: 'Climate and environmental justice',
        help: 'Within a disadvantaged community as defined by the Climate and Environmental Justice Screening tool.  These include overburdened and underserved Census tracts and American Indian and Alaska Native areas as defined by the Census.', // TODO:,
        sort: false,
        hideIfEmpty: true,
        isArray: true,
        labels: Object.values(DISADVANTAGED_COMMUNITY),
        values: Object.keys(DISADVANTAGED_COMMUNITY),
      },
      {
        field: 'fishhabitatpartnership',
        title: 'Fish Habitat Partnerships working in area',
        help: '',
        sort: false,
        hideMissingValues: true,
        hideIfEmpty: true,
        isArray: true,
        labels: Object.values(FISH_HABITAT_PARTNERSHIPS).map(
          ({ name }) => name
        ),
        values: Object.keys(FISH_HABITAT_PARTNERSHIPS),
      },
    ],
  },
  {
    id: 'conservation_benefits',
    title: 'Conservation benefits',
    filters: [
      {
        field: 'passability',
        title: 'Passability',
        sort: false,
        hideMissingValues: true,
        help: 'Note: passability information is only available for a small number of dams.  Not all data sources recorded this information.',
        ...getEntries(PASSABILITY),
      },
      {
        field: 'gainmilesclass',
        title: 'Miles gained',
        ...getEntries(GAINMILES),
      },
      {
        field: 'percentalteredclass',
        title: 'Percent of upstream network in altered stream channels',
        sort: false,
        help: 'Note: altered reaches are those specifically identified in NHD or the National Wetlands Inventory as altered (canal / ditch, within a reservoir, or other channel alteration); this status is not consistently available for all stream reaches.',
        ...getEntries(PERCENT_ALTERED),
      },
    ],
  },
  {
    id: 'climate',
    title: 'Climate resilience',
    filters: [
      {
        field: 'percentresilientclass',
        title: 'Percent of upstream network in resilient watersheds',
        sort: false,
        help: "Resilient watersheds are those with above average or greater freshwater resilience within The Nature Conservancy's Freshwater Resilience dataset (v0.44).  Note: not available for Alaska, far southern Florida, Puerto Rico, or the U.S. Virgin Islands.",
        url: 'https://www.maps.tnc.org/resilientrivers/#/explore',
        ...getEntries(PERCENT_RESILIENT),
      },
    ],
  },
  {
    id: 'regulatory',
    title: 'Regulatory',
    filters: [
      {
        field: 'fercregulated',
        title: 'Regulated by the Federal Energy Regulatory Commission?',
        help: 'Note: regulatory information is only available for a small number of dams.',
        hideMissingValues: true,
        ...getEntries(FERC_REGULATED, (v) => v >= 0),
      },
      {
        field: 'stateregulated',
        title: 'State regulated dam?',
        help: 'Note: regulatory information is only available for a small number of dams.',
        hideMissingValues: true,
        ...getEntries(STATE_REGULATED, (v) => v >= 0),
      },
      {
        field: 'waterright',
        title: 'Has an associated water right?',
        help: 'Note: water right information is only available for a small number of dams.',
        ...getEntries(WATER_RIGHT, (v) => v >= 0),
      },
    ],
  },
  {
    id: 'structure',
    title: 'Dam characteristics',
    filters: [
      {
        field: 'heightclass',
        title: 'Height',
        help: 'Note: height information is only available for a small number of dams.  Not all data sources recorded this information.',
        ...getEntries(HEIGHT, (v) => v > 0),
      },
      {
        field: 'hazard',
        title: 'Hazard rating',
        help: 'Note: hazard rating information is only available for a small number of dams.  Not all data sources recorded this information.',
        ...getEntries(HAZARD, (v) => v >= 0),
      },
      {
        field: 'condition',
        title: 'Condition',
        sort: true,
        hideMissingValues: true,
        help: 'Note: condition information is only available for a small number of dams.  Not all data sources recorded this information.',
        ...getEntries(CONDITION),
      },
      {
        field: 'purpose',
        title: 'Purpose',
        sort: true,
        hideMissingValues: true,
        help: 'Note: purpose information is only available for a small number of dams.  Not all data sources recorded this information.',
        ...getEntries(PURPOSE, (v) => v >= 0),
      },
      {
        field: 'yearcompletedclass',
        title: 'Dam age',
        help: 'Note: dam age is based on year completed information that is only available for a small number of dams.  Not all data sources recorded this information.',
        ...getEntries(YEARCOMPLETED, (v) => v > 0),
      },
      {
        field: 'lowheaddam',
        title: 'Is it a lowhead dam?',
        sort: false,
        help: 'Note: lowhead dam status is only available for a small number of dams.  Not all data sources recorded this information.  Likely lowhead dams are those specifically marked as run-of-river dams with a height <= 15 ft.',
        ...getEntries(LOWHEAD_DAM, (v) => v >= 0),
      },
      {
        field: 'passagefacilityclass',
        title: 'Does it have a fish passage facility?',
        sort: false,
        hideMissingValues: false,
        help: 'Note: fish passage facility information is only available for a small number of dams.  Not all data sources recorded this information.',
        ...getEntries(PASSAGEFACILITY_CLASS),
      },
    ],
  },
  {
    id: 'network',
    title: 'Aquatic network characteristics',
    filters: [
      {
        field: 'streamorderclass',
        title: 'Stream order (NHD modified Strahler)',
        ...getEntries(STREAMORDER),
      },
      {
        field: 'intermittent',
        title: 'Located on an intermittent / ephemeral stream',
        sort: false,
        help: 'Note: intermittent / ephemeral status is assigned in the underlying NHD data and is not consistently assigned for all stream reaches.  Non-intermittent reaches may have perennial flow or be assigned to a different stream reach type which precludes intermittent / ephemeral status.',
        ...getEntries(INTERMITTENT),
      },
      {
        field: 'waterbodysizeclass',
        title: 'Size of associated pond or lake',
        sort: false,
        help: 'Note: dams are associated with ponds or lakes extracted from NHD and the National Wetlands Inventory (NWI) if they spatially overlap; the associated pond or lake is not necessarily a result of an impoundment created by the dam.  Many small lakes and ponds are not present in NHD and NWI.',
        ...getEntries(WATERBODY_SIZECLASS),
      },
    ],
  },
  {
    id: 'marine',
    title: 'Marine connectivity',
    hasData: hasDiadromousData,
    filters: [
      {
        field: 'flowstoocean',
        title: 'On a network that flows to ocean',
        sort: false,
        help: 'Note: this is limited to networks that are known to connect to marine areas identified by NHD for NHD regions included in this tool, and may not be set correctly for networks that flow through other NHD regions not included in the analysis or outside the U.S. before connecting to marine areas.',
        ...getEntries(BOOLEAN_FIELD),
      },
      {
        field: 'coastalhuc8',
        title: 'Within a coastal subbasin',
        sort: false,
        // help: '',
        ...getEntries(BOOLEAN_FIELD),
      },
      {
        field: 'downstreamoceanmilesclass',
        title: 'Miles downstream to the ocean',
        sort: false,
        help: 'This value is based on linear miles downstream along aquatic network to the ocean.  Note: distances close to the coast may not be accurate due to inaccuracies in how marine areas are identified with respect to the aquatic network downstream termination points.',
        ...getEntries(DOWNSTREAM_OCEAN_MILES, (v) => v > 0),
      },
      {
        field: 'downstreamoceanbarriersclass',
        title: 'Number of dams between this dam and the ocean',
        sort: false,
        help: 'This value is based on any dams that occur on the downstream path between this dam and the ocean.',
        ...getEntries(DOWNSTREAM_OCEAN_DAMS_DOMAIN, (v) => v > 0),
      },
    ],
  },
  {
    id: 'ownership',
    title: 'Land and barrier ownership',
    filters: [
      {
        field: 'ownertype',
        title: 'Land ownership type',
        hideMissingValues: true,
        help: 'This information is derived from the BLM Surface Management Agency dataset for federal lands and CBI Protected Areas Database and TNC Secured Lands Database for non-federal lands, to highlight ownership types of particular importance to partners.  NOTE: this does not include most private land.',
        ...getEntries(OWNERTYPE),
      },
      {
        field: 'barrierownertype',
        title: 'Barrier ownership type',
        sort: true,
        ...getEntries(BARRIEROWNERTYPE),
      },
    ],
  },

  {
    id: 'invasivespecies',
    title: 'Invasive species management',
    filters: [
      {
        field: 'invasivenetwork',
        title: 'Upstream of an invasive species barrier?',
        hideMissingValues: false,
        help: 'Includes all barriers that are upstream of a barrier identified as a beneficial to restricting the movement of invasive species.',
        ...getEntries(INVASIVE_NETWORK),
      },
    ],
  },

  {
    id: 'species',
    title: 'Presence of key species',
    filters: [
      {
        field: 'tesppclass',
        title: 'Number of federally-listed Threatened & Endangered Species',
        hideMissingValues: true,
        help: 'Note: This information is based on occurrences of one or more federally- threatened or endangered aquatic species within the same subwatershed as the dam.  These species may or may not be impacted by this dam.  Information on these species is limited and comprehensive information has not been provided for all states at this time.',
        url: '/sgcn',
        ...getEntries(RARESPP),
      },
      {
        field: 'statesgcnsppclass',
        title: 'Number of state-listed Species of Greatest Conservation Need',
        hideMissingValues: true,
        help: 'Note: This information is based on occurrences within the same subwatershed as the dam.  These species may or may not be impacted by this dam.  Information on these species is limited and comprehensive information has not been provided for all states at this time.',
        url: '/sgcn',
        ...getEntries(RARESPP),
      },
      {
        field: 'trout',
        title: 'Interior and eastern native trout presence / absence',
        help: 'Note: This information is based on occurrences of Apache, brook, bull, cutthroat, Gila, lake, and redband trout species within the same subwatershed as the barrier.  These species may or may not be impacted by this barrier.  Information on these species is limited and comprehensive information has not been provided for all states at this time.',
        sort: false,
        hideMissingValues: false,
        ...getEntries(TROUT),
      },
      {
        field: 'salmonidesucount',
        title:
          'Number of salmon Evolutionarily Significant Units / Steelhead trout Discrete Population Segments',
        help: 'This information is based on the presence of salmon Evolutionarily Significant Units (ESU) or steelhead trout Discrete Population Segments (DPS) within the same watershed as the dam, as provided by NOAA at the subwatershed level. These species may or may not be impacted by this dam.',
        sort: false,
        hideMissingValues: false,
        hideIfEmpty: true,
        ...getEntries(SALMONID_ESU_COUNT),
      },
      {
        field: 'salmonidesu',
        title:
          'Salmon Evolutionarily Significant Units / Steelhead trout Discrete Population Segments',
        help: 'This information is based on the presence of salmon Evolutionarily Significant Units (ESU) or steelhead trout Discrete Population Segments (DPS) within the same watershed as the dam, as provided by NOAA at the subwatershed level. These species may or may not be impacted by this dam.',
        sort: false,
        hideMissingValues: true,
        hideIfEmpty: true,
        isArray: true,
        labels: Object.values(SALMONID_ESU),
        values: Object.keys(SALMONID_ESU),
      },
    ],
  },
]
