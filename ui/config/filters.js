import {
  HEIGHT,
  CONSTRUCTION,
  PURPOSE,
  FEASIBILITY,
  RARESPP,
  STREAMORDER,
  GAINMILES,
  BARRIER_SEVERITY,
  CROSSING_TYPE,
  ROAD_TYPE,
  DAM_CONDITION,
  BARRIER_CONDITION,
  OWNERTYPE,
  HUC8_USFS,
  HUC8_COA,
  HUC8_SGCN,
} from './constants'

const getIntKeys = obj =>
  Object.keys(obj)
    .map(k => parseInt(k, 10))
    .sort()

/**
 * Get sorted integer keys and labels for each entry in a keyed object
 * @param {Object} obj
 */
const getEntries = obj => {
  const values = getIntKeys(obj)
  return {
    values,
    labels: values.map(key => obj[key]),
  }
}

const sizeclassValues = [0, 1, 2, 3, 4, 5, 6, 7]

const priorityFilters = [
  {
    field: 'huc8_usfs',
    title: 'USFS priority watersheds',
    sort: false,
    hideEmpty: true,
    help:
      'These include TNC critical watersheds, TNC hotspots, watersheds containing USFWS Critical Habitat, SARP priority watersheds, watersheds containing aquatic passage inventories, and EPA priority watersheds.',
    ...getEntries(HUC8_USFS),
    url: '/priorities/usfs',
  },
  {
    field: 'huc8_coa',
    title: 'SARP conservation opportunity areas',
    sort: false,
    hideEmpty: true,
    help: '',
    ...getEntries(HUC8_COA),
  },
  {
    field: 'huc8_sgcn',
    title:
      'Watersheds with most Species of Greatest Conservation Need per state',
    sort: false,
    hideEmpty: true,
    help: '',
    ...getEntries(HUC8_SGCN),
  },
]

// Each filter needs to have a dimension above that matches the key here
const dams = [
  {
    field: 'feasibility',
    title: 'Feasibility & Conservation Benefit',
    help:
      'Note: feasibility is based on further reconnaissance to evaluate individual barriers. Values are provided only for those that have been evaluated. There may be more feasible or infeasible dams than are indicated above.',
    ...getEntries(FEASIBILITY),
  },
  {
    field: 'gainmilesclass',
    title: 'Miles Gained',
    ...getEntries(GAINMILES),
  },
  {
    field: 'heightclass',
    title: 'Dam Height',
    hideEmpty: true,
    help:
      'Note: height information is only available for a small number of dams.  Not all data sources recorded this information.',
    ...getEntries(HEIGHT),
  },
  {
    field: 'sizeclasses',
    title: 'Upstream Size Classes',
    values: sizeclassValues,
    labels: sizeclassValues,
  },
  {
    field: 'tesppclass',
    title: 'Number of Federally-Listed Threatened & Endangered Species',
    hideEmpty: true,
    help:
      'Note: This information is based on occurrences of one or more federally- threatened or endangered aquatic species within the same subwatershed as the dam.  These species may or may not be impacted by this dam.  Information on these species is limited and comprehensive information has not been provided for all states at this time.',
    ...getEntries(RARESPP),
  },
  {
    field: 'othersppclass',
    title: 'Number of State and Regional Species of Greatest Conservation Need',
    hideEmpty: true,
    help:
      'Note: This information is based on occurrences of one or more state threatened or endangered aquatic species, other species of Greatest Conservation Need within the region, that occur within the same subwatershed as the dam.  These species may or may not be impacted by this dam.  Information on these species is limited and comprehensive information has not been provided for all states at this time.',
    ...getEntries(RARESPP),
  },
  {
    field: 'streamorderclass',
    title: 'Stream Order (NHD modified Strahler)',
    ...getEntries(STREAMORDER),
  },
  {
    field: 'condition',
    title: 'Dam Condition',
    sort: true,
    hideEmpty: true,
    help:
      'Note: condition information is only available for a small number of dams.  Not all data sources recorded this information.',
    ...getEntries(DAM_CONDITION),
  },
  {
    field: 'construction',
    title: 'Dam Construction Materials',
    sort: true,
    hideEmpty: true,
    help:
      'Note: construction information is only available for a small number of dams.  Not all data sources recorded this information.',
    ...getEntries(CONSTRUCTION),
  },
  {
    field: 'purpose',
    title: 'Purpose',
    sort: true,
    hideEmpty: true,
    help:
      'Note: purpose information is only available for a small number of dams.  Not all data sources recorded this information.',
    ...getEntries(PURPOSE),
  },
  {
    field: 'ownertype',
    title: 'Land ownership type',
    sort: true,
    hideEmpty: true,
    help:
      'This information is derived from the CBI Protected Areas Database and TNC Secured Lands Database, to highlight ownership types of particular importance to partners.  NOTE: this does not include most private land.',
    ...getEntries(OWNERTYPE),
  },
  ...priorityFilters,
]

const barriers = [
  {
    field: 'severityclass',
    title: 'Barrier Severity',
    sort: true,
    hideEmpty: true,
    ...getEntries(BARRIER_SEVERITY),
  },
  {
    field: 'crossingtypeclass',
    title: 'Crossing Type',
    sort: true,
    hideEmpty: true,
    ...getEntries(CROSSING_TYPE),
  },
  {
    field: 'roadtypeclass',
    title: 'Road Type',
    sort: true,
    hideEmpty: true,
    ...getEntries(ROAD_TYPE),
  },
  {
    field: 'gainmilesclass',
    title: 'Miles Gained',
    ...getEntries(GAINMILES),
  },
  {
    field: 'conditionclass',
    title: 'Barrier Condition',
    sort: true,
    hideEmpty: true,
    ...getEntries(BARRIER_CONDITION),
  },
  {
    field: 'sizeclasses',
    title: 'Upstream Size Classes',
    values: sizeclassValues,
    labels: sizeclassValues,
  },
  {
    field: 'tesppclass',
    title: 'Number of Federally-Listed Threatened and Endangered Species',
    hideEmpty: true,
    help:
      'Note: This information is based on occurrences of one or more federally-listed threatened or endangered aquatic species within the same subwatershed as the barrier.  These species may or may not be impacted by this dam.  Information on these species is limited and comprehensive information has not been provided for all states at this time.',
    ...getEntries(RARESPP),
  },
  {
    field: 'othersppclass',
    title: 'Number of State and Regional Species of Greatest Conservation Need',
    hideEmpty: true,
    help:
      'Note: This information is based on occurrences of one or more state-listed threatened or endangered aquatic species, other species of Greatest Conservation Need within the region, that occur within the same subwatershed as the barrier.  These species may or may not be impacted by this dam.  Information on these species is limited and comprehensive information has not been provided for all states at this time.',
    ...getEntries(RARESPP),
  },
  {
    field: 'ownertype',
    title: 'Land ownership type',
    sort: true,
    hideEmpty: true,
    help:
      'This information is derived from the CBI Protected Areas Database and TNC Secured Lands Database, to highlight ownership types of particular importance to partners.  NOTE: does not include most private land.',
    ...getEntries(OWNERTYPE),
  },
  ...priorityFilters,
]

export const FILTERS = {
  dams,
  barriers,
}
