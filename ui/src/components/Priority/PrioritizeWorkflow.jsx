import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import { Flex, Box } from 'components/Grid'
import Sidebar from 'components/Sidebar'
import BarrierDetails from 'components/BarrierDetails'
import styled from 'style'

import Map from './Map'
import UnitChooser from './UnitChooser'
import LayerChooser from './LayerChooser'

const Wrapper = styled(Flex)`
  height: 100%;
`

const MapContainer = styled.div`
  position: relative;
  flex: 1 0 auto;
  height: 100%;
`

const Prioritize = ({ barrierType }) => {
  const [selectedBarrier, setSelectedBarrier] = useState(null)
  const [searchFeature, setSearchFeature] = useState(null)

  // TODO: use an object keyed by ID instead
  const [summaryUnits, setSummaryUnits] = useState([])

  // TODO: wrap into useReducer?
  const [step, setStep] = useState('select')
  const [layer, setLayer] = useState(null)

  // TODO: wrap into custom hook
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleSearch = useCallback(nextSearchFeature => {
    setSearchFeature(nextSearchFeature)
  }, [layer])

  const handleSetLayer = nextLayer => {
    setLayer(nextLayer)
    setSearchFeature(null)
  }

  // Toggle selected unit in or out of selection
  const handleSelectUnit = unit => {
    const { id } = unit

    setSummaryUnits(prevSummaryUnits => {
      // NOTE: we are always creating a new object,
      // because we cannot mutate the underlying object
      // without causing the setSummaryUnits call to be a no-op
      const index = prevSummaryUnits.findIndex(
        ({ id: unitId }) => unitId === id
      )

      if (index === -1) {
        // add it
        return prevSummaryUnits.concat([unit])
      }

      // remove it
      return prevSummaryUnits
        .slice(0, index)
        .concat(prevSummaryUnits.slice(index + 1))
    })

    setSearchFeature(null)
  }

  const handleSelectBarrier = feature => {
    setSelectedBarrier(feature)
  }

  const handleDetailsClose = () => {
    selectedBarrier(null)
    setSearchFeature(null)
  }

  let sidebarContent = null

  if (selectedBarrier === null) {
    if (isError) {
      // TODO
      sidebarContent = (
        <div className="container notification-container flex-container-column flex-justify-center flex-grow">
          <div className="notification is-error">
            <i className="fas fa-exclamation-triangle" />
            &nbsp; Whoops! There was an error loading these data. Please refresh
            your browser page and try again.
          </div>
          <p className="has-text-grey">
            If it happens again, please{' '}
            <a href="mailto:kat@southeastaquatics.net">contact us</a>.
          </p>
        </div>
      )
    } else if (isLoading) {
      // TODO
      sidebarContent = (
        <div className="loading-spinner flex-container flex-justify-center flex-align-center">
          <div className="fas fa-sync fa-spin" />
          <p>Loading...</p>
        </div>
      )
    } else {
      switch (step) {
        case 'select': {
          if (layer === null) {
            sidebarContent = <LayerChooser setLayer={handleSetLayer} />
          } else {
            sidebarContent = (
              <UnitChooser
                barrierType={barrierType}
                layer={layer}
                summaryUnits={summaryUnits}
                onBack={() => handleSetLayer(null)}
                selectUnit={handleSelectUnit}
                setSearchFeature={handleSearch}
              />
            )
          }
          break
        }
        default: {
          sidebarContent = null
        }
        // case "filter": {
        //     sidebarContent = <FiltersList />
        //     break
        // }
        // case "results": {
        //     sidebarContent = <Results />
        //     break
        // }
      }
    }
  }

  return (
    <Wrapper>
      <Sidebar>
        {selectedBarrier !== null ? (
          <BarrierDetails barrier={selectedBarrier} barrierType={barrierType} />
        ) : (
          sidebarContent
        )}
      </Sidebar>

      <MapContainer>
        <Map
          barrierType={barrierType}
          activeLayer={layer}
          searchFeature={searchFeature}
          selectedBarrier={selectedBarrier}
          summaryUnits={summaryUnits}
          onSelectUnit={handleSelectUnit}
        />
      </MapContainer>
    </Wrapper>
  )
}

Prioritize.propTypes = {
  barrierType: PropTypes.string.isRequired,
}

export default Prioritize
