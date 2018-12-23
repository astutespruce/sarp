import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"

import "bulma-pageloader/dist/css/bulma-pageloader.min.css"

import * as actions from "../../../actions/priority"
import Start from "./Start"
import Map from "./Map"
import Sidebar from "../../Sidebar"
import { FeaturePropType } from "../../../CustomPropTypes"

// import FeatureDetails from "./FeatureDetails"
import Barrier from "../../barriers/Barrier"
import LayerChooser from "./LayerChooser"
import UnitChooser from "./UnitsList"
import FiltersList from "./FiltersList"
import Results from "./Results"

const Priority = ({ isLoading, isError, type, mode, selectedFeature, layer, selectFeature, setType }) => {
    let content = null

    if (isError) {
        content = (
            <div className="container notification-container flex-container-column flex-justify-center flex-grow">
                <div className="notification is-error">
                    <i className="fas fa-exclamation-triangle" />
                    &nbsp; Whoops! There was an error loading these data. Please refresh your browser page and try
                    again.
                </div>
                <p className="text-help">
                    If it happens again, please <a href="mailto:kat@southeastaquatics.net">contact us</a>.
                </p>
            </div>
        )

        return content
    }
    if (isLoading) {
        content = (
            <div className="loading-spinner flex-container flex-justify-center flex-align-center">
                <div className="fas fa-sync fa-spin" />
                <p>Loading...</p>
            </div>
        )
    } else if (selectedFeature !== null) {
        content = <Barrier barrier={selectedFeature.toJS()} onClose={() => selectFeature(null)} />
    } else {
        switch (mode) {
            case "select": {
                if (layer === null) {
                    content = <LayerChooser />
                } else {
                    content = <UnitChooser />
                }
                break
            }
            case "filter": {
                content = <FiltersList />
                break
            }
            case "results": {
                content = <Results />
                break
            }
        }
    }

    return (
        <React.Fragment>
            {type === null ? (
                <Start setType={setType} />
            ) : (
                <React.Fragment>
                    <Sidebar>{content}</Sidebar>
                    <div id="MapContainer">
                        <Map />
                    </div>
                </React.Fragment>
            )}
        </React.Fragment>
    )
}

Priority.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    isError: PropTypes.bool.isRequired,
    type: PropTypes.string,
    mode: PropTypes.string.isRequired,
    selectedFeature: FeaturePropType,
    layer: PropTypes.string,
    // summaryUnits: ImmutablePropTypes.set.isRequired,
    // filters: ImmutablePropTypes.mapOf(
    //     ImmutablePropTypes.setOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    // ).isRequired,
    // totalCount: PropTypes.number.isRequired,

    setType: PropTypes.func.isRequired,
    // setLayer: PropTypes.func.isRequired,
    selectFeature: PropTypes.func.isRequired
    // selectUnit: PropTypes.func.isRequired,
    // setMode: PropTypes.func.isRequired
    // fetchQuery: PropTypes.func.isRequired,
    // fetchRanks: PropTypes.func.isRequired
}

Priority.defaultProps = {
    type: null,
    selectedFeature: null,
    layer: null
}

const mapStateToProps = globalState => {
    const state = globalState.get("priority")

    return {
        isLoading: state.get("isLoading"),
        isError: state.get("isError"),
        type: state.get("type"),
        mode: state.get("mode"),
        system: state.get("system"),
        layer: state.get("layer"),
        totalCount: state.get("totalCount"),
        selectedFeature: state.get("selectedFeature"),
        summaryUnits: state.get("summaryUnits"),
        filters: state.get("filters")
    }
}

export default connect(
    mapStateToProps,
    actions
)(Priority)
