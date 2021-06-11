import React from 'react'
import PropTypes from 'prop-types'
import { Document, Page, StyleSheet, View } from '@react-pdf/renderer'

import Construction from './Construction'
import Contact from './Contact'
import Credits from './Credits'
import Feasibility from './Feasibility'
import Footer from './Footer'
import Header from './Header'
import IDInfo from './IDInfo'
import Legend from './Legend'
import Location from './Location'
import LocatorMap from './LocatorMap'
import Map from './Map'
import Network from './Network'
import Scores from './Scores'
import Species from './Species'
import { Flex } from './elements'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    paddingTop: '0.5in',
    paddingBottom: '1in',
    paddingHorizontal: '0.5in',
    fontSize: 12,
    lineHeight: 1.4,
    color: '#333',
  },
})

const Report = ({ barrierType, data, map, locatorMap, attribution, scale }) => {
  const { county, state, hasnetwork, sarpid } = data
  const name =
    data.name || barrierType === 'dams'
      ? `Unknown dam name (SARPID: ${sarpid})`
      : `Unnamed crossing (SARPID ${sarpid})`

  return (
    <Document
      author="generated by the Southeast Aquatic Barrier Prioritization Tool"
      creator="Southeast Aquatic Barrier Prioritization Tool"
      title={`Barrier Report for ${name}, ${county} County, ${state}`}
      keywords="aquatic barriers, hydrology, dams"
      language="en-us"
    >
      <Page style={styles.page} size="LETTER">
        <Header {...data} />

        <Map map={map} attribution={attribution} scale={scale} />

        <Flex>
          <LocatorMap map={locatorMap} />
          <Legend barrierType={barrierType} name={name} />
        </Flex>

        <Footer />
      </Page>

      <Page style={styles.page} size="LETTER">
        <Flex wrap={false}>
          <View style={{ flex: '1 1 50%', marginRight: 36 }}>
            <Location {...data} />
          </View>
          <View style={{ flex: '1 1 50%' }}>
            <Construction barrierType={barrierType} {...data} />
          </View>
        </Flex>

        <Flex style={{ marginTop: 24 }} wrap={false}>
          <View
            style={{
              flex: `1 1 ${hasnetwork ? '50%' : '100%'}`,
              marginRight: 36,
            }}
          >
            <Network barrierType={barrierType} {...data} />
          </View>
          {hasnetwork ? (
            <View style={{ flex: '1 1 50%' }}>
              <Scores barrierType={barrierType} {...data} />
            </View>
          ) : null}
        </Flex>

        <View style={{ marginTop: 24 }} wrap={false}>
          <Species {...data} />
        </View>

        <View style={{ marginTop: 24 }} wrap={false}>
          <Feasibility {...data} />
        </View>

        <View style={{ marginTop: 24 }} wrap={false}>
          <IDInfo {...data} />
        </View>

        <View style={{ marginTop: 24 }} wrap={false}>
          <Contact barrierType={barrierType} {...data} />
        </View>

        <View style={{ marginTop: 24 }} wrap={false}>
          <Credits />
        </View>

        <Footer />
      </Page>
    </Document>
  )
}

Report.propTypes = {
  barrierType: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  map: PropTypes.string.isRequired,
  locatorMap: PropTypes.string.isRequired,
  attribution: PropTypes.string.isRequired,
  scale: PropTypes.shape({
    width: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
}

export default Report
