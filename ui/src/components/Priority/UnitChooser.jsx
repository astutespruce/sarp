import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Heading, Text } from 'theme-ui'
import { ExclamationTriangle } from '@emotion-icons/fa-solid'

import UnitSearch from 'components/UnitSearch'
import { useBarrierType } from 'components/Data'
import { formatNumber } from 'util/format'

import BackLink from './BackLink'
import StartOverButton from './StartOverButton'
import SubmitButton from './SubmitButton'
import UnitListItem from './UnitListItem'
import { LAYER_ZOOM } from '../../../config/constants'

const getPluralLabel = (layer) => {
  switch (layer) {
    case 'State':
      return 'states'
    case 'County':
      return 'counties'
    case 'HUC6':
      return 'basins'
    case 'HUC8':
      return 'subbasins'
    case 'HUC12':
      return 'subwatersheds'
    case 'ECO3':
      return 'ecoregions'
    case 'ECO4':
      return 'ecoregions'
    default:
      return 'areas'
  }
}

const getSingularLabel = (layer) => {
  switch (layer) {
    case 'State':
      return 'state'
    case 'County':
      return 'county'
    case 'HUC6':
      return 'basin'
    case 'HUC8':
      return 'subbasin'
    case 'HUC12':
      return 'subwatershed'
    case 'ECO3':
      return 'ecoregion'
    case 'ECO4':
      return 'ecoregion'
    default:
      return 'area'
  }
}

const getSingularArticle = (layer) => {
  if (layer === 'ECO3' || layer === 'ECO4') return 'an'
  return 'a'
}

const UnitChooser = ({
  layer,
  summaryUnits,
  selectUnit,
  onBack,
  onSubmit,
  setSearchFeature,
}) => {
  const barrierType = useBarrierType()
  const [searchValue, setSearchValue] = useState('')

  const pluralLabel = getPluralLabel(layer)
  const singularLabel = getSingularLabel(layer)
  const article = getSingularArticle(layer)

  let offNetworkCount = 0
  let total = 0
  if (summaryUnits.length > 0) {
    switch (barrierType) {
      case 'dams': {
        offNetworkCount = summaryUnits.reduce(
          (out, v) => out + (v.dams - v.on_network_dams),
          0
        )
        total = summaryUnits.reduce((out, v) => out + v.on_network_dams, 0)
        break
      }
      case 'barriers': {
        offNetworkCount = summaryUnits.reduce(
          (out, v) => out + (v.barriers - v.on_network_barriers),
          0
        )
        total = summaryUnits.reduce((out, v) => out + v.on_network_barriers, 0)
        break
      }
      default: {
        break
      }
    }
  }

  const handleSearchChange = (value) => {
    setSearchValue(value)
  }

  const handleSearchSelect = (item) => {
    setSearchFeature(item, LAYER_ZOOM[layer])
    setSearchValue('')
  }

  return (
    <Flex sx={{ flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          flex: '0 0 auto',
          py: '1rem',
          pr: '0.5rem',
          pl: '1rem',
          borderBottom: '1px solid #DDD',
          bg: '#f6f6f2',
        }}
      >
        <BackLink label="choose a different type of area" onClick={onBack} />
        <Heading as="h3">Choose {pluralLabel}</Heading>
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          p: '1rem',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {summaryUnits.length === 0 ? (
          <Text variant="help">
            Select your {pluralLabel} of interest by clicking on them in the
            map.
            <br />
            <br />
            If boundaries are not currently visible on the map, zoom in further
            until they appear.
            <br />
            <br />
          </Text>
        ) : (
          <Box
            as="ul"
            sx={{
              m: '0 0 2rem 0',
              p: 0,
              listStyle: 'none',
            }}
          >
            {summaryUnits.map((unit) => (
              <UnitListItem
                key={unit.id}
                layer={layer}
                unit={unit}
                onDelete={() => selectUnit(unit)}
              />
            ))}
          </Box>
        )}

        <UnitSearch
          layer={layer}
          value={searchValue}
          onChange={handleSearchChange}
          onSelect={handleSearchSelect}
        />

        {summaryUnits.length > 0 ? (
          <>
            <Text variant="help" sx={{ py: '2rem' }}>
              Select additional {pluralLabel} by clicking on them on the map or
              using the search above. To unselect {article} {singularLabel}, use
              the trash button above or click on it on the map.
            </Text>
            {offNetworkCount > 0 ? (
              <Text variant="help" sx={{ pb: '2rem' }}>
                Note: only {barrierType} that have been evaluated for aquatic
                network connectivity are available for prioritization. There are{' '}
                <b>{formatNumber(offNetworkCount, 0)}</b> {barrierType} not
                available for prioritization in your selected area.
              </Text>
            ) : null}
          </>
        ) : null}

        {layer !== 'State' && layer !== 'County' ? (
          <Text variant="help" sx={{ pt: '2rem' }}>
            <ExclamationTriangle
              size="1em"
              style={{ marginRight: '0.25rem' }}
            />
            Note: You can choose from {pluralLabel} outside the highlighted
            states in the Southeast, but the barriers inventory is likely more
            complete only where {pluralLabel} overlap the highlighted states.
          </Text>
        ) : null}
      </Box>

      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          p: '1rem',
          flex: '0 0 auto',
          borderTop: '1px solid #DDD',
          bg: '#f6f6f2',
        }}
      >
        <StartOverButton />

        <SubmitButton
          disabled={summaryUnits.size === 0 || total === 0}
          onClick={onSubmit}
          label={`Select ${barrierType} in this area`}
        />
      </Flex>
    </Flex>
  )
}

UnitChooser.propTypes = {
  layer: PropTypes.string.isRequired,
  summaryUnits: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ).isRequired,
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  selectUnit: PropTypes.func.isRequired,
  setSearchFeature: PropTypes.func.isRequired,
}

export default UnitChooser
