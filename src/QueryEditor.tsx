// POC TODO
// Alerts using Grafana's Alerting system TODO
// Historian functions CHECK
// - statistical like avg, max, min, etc CHECK
// - gapfilling, last observation carried forward, downsampling. NEEDS time_bucket_gapfill() CHECK
// User defined functions TODO
// Export REST call to get data TODO

import React, {PureComponent} from 'react';
import {Cascader, CascaderOption, InlineLabel, Alert, FieldSet, Select, MultiSelect, Input} from '@grafana/ui';
import {QueryEditorProps, SelectableValue} from '@grafana/data';
import {DataSource} from './datasource';
import {FactoryinsightDataSourceOptions, FactoryinsightQuery} from './types';

import {GetDefaultEnterprise, DefaultTags, DefaultKPIs, DefaultWorkCellTags, DefaultTables} from './demoData'

type Props = QueryEditorProps<DataSource, FactoryinsightQuery, FactoryinsightDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {

    objectStructure: Array<CascaderOption> = [];
    valueStructure: Array<CascaderOption> = [];

    tagsValueID: string = 'tags'
    KPIValueID: string = 'kpi'

    selectedObject: string = '';
    selectedValue: string = '';

    // Aggregates configuration
    tagAggregatesOptions = [
        {label: 'Average', value: "avg", description: 'The average value of all values in the time bucket'},
        {label: 'Minimum', value: "min", description: 'The minimum value of all values in the time bucket'},
        {label: 'Maximum', value: "max", description: 'The maximum value of all values in the time bucket'},
        {label: 'Sum', value: "sum", description: 'The sum of all values in the time bucket'},
        {label: 'Count', value: "count", description: 'The number of values in the time bucket'},

    ];
    defaultConfigurationAggregates: SelectableValue = this.tagAggregatesOptions[0];
    selectedConfigurationAggregates: Array<SelectableValue> = [this.defaultConfigurationAggregates];

    // time bucket configuration
    defaultConfigurationTimeBucket: string = "auto";
    selectedConfigurationTimeBucket: string = this.defaultConfigurationTimeBucket;

    // Gapfilling configuration
    tagGapfillingOptions = [
        {label: 'Show as NULL (default)', value: "null", description: 'Missing data will show as NULL'},
        {label: 'Interpolate', value: "interpolation", description: 'The interpolate function does linear interpolation for missing values.'},
        {label: 'LOCF', value: "locf", description: 'The LOCF (last observation carried forward) function allows you to carry the last seen value in an aggregation group forward. '},
    ];
    defaultConfigurationGapfilling: SelectableValue = this.tagGapfillingOptions[0];
    selectedConfigurationGapfilling: SelectableValue = this.defaultConfigurationGapfilling;




    constructor(props: Props) {
        super(props);

        this.selectedObject = this.props.query.fullTagName || '';
        this.selectedValue = this.props.query.value || '';

        // loop through this.props.query.configurationTagAggregates and add to selectedConfigurationAggregates
        const currentConfigurationAggregates = this.props.query.configurationTagAggregates || [this.defaultConfigurationAggregates];
        for (let i = 0; i < currentConfigurationAggregates.length; i++) {
            const currentValue = currentConfigurationAggregates[i];

            // check if currentValue is in this.tagAggregatesOptions
            for (let j = 0; j < this.tagAggregatesOptions.length; j++) {
                const currentOption = this.tagAggregatesOptions[j];
                if (currentValue === currentOption.value) {
                    this.selectedConfigurationAggregates.push(currentOption);
                }
            }
        }

        // check this.props.query.configurationTagGapfilling and add to selectedConfigurationGapfilling
        const currentGapfill = this.props.query.configurationTagGapfilling || this.defaultConfigurationGapfilling.value;
        for (let i = 0; i < this.tagGapfillingOptions.length; i++) {
            const currentOption = this.tagGapfillingOptions[i];
            if (currentGapfill === currentOption.value) {
                this.selectedConfigurationGapfilling = currentOption;
            }
        }

        // check this.props.query.configurationTagTimeBucket and add to selectedConfigurationTimeBucket
        this.selectedConfigurationTimeBucket = this.props.query.configurationTimeBucket || this.defaultConfigurationTimeBucket;

   }


    isObjectSelected = () => {
        return this.selectedObject !== '';
    }

    isValidValueSelected = () => {
        if (this.selectedValue === '') {
            return false;
        } else if (this.selectedValue === this.KPIValueID || this.selectedValue === this.tagsValueID || this.selectedValue === this.tagsValueID+'/custom' || this.selectedValue === this.tagsValueID+'/automated') {
            return false;
        } else {
            return true
        }
    }

    // isCurrentSelectedValueACustomTag checks whether the current selected value is a tag and therefore, begins with tagsValueID
    isCurrentSelectedValueACustomTag = () => {
        if (this.isValidValueSelected()) {
            return this.selectedValue.startsWith(this.tagsValueID+'/custom');
        } else {
            return false;
        }
    }

    getObjectStructure = () => {
        this.objectStructure = [
            {
                label: 'BreweryCo',
                value: 'BreweryCo',
                items: GetDefaultEnterprise('BreweryCo')
            }
        ]
        return this.objectStructure;
    }

    getValueStructure = () => {
        if (this.props.query.workCell === '' || this.props.query.workCell === undefined) {
            this.valueStructure = [
                {
                    label: 'Tags',
                    value: this.tagsValueID,
                    items: DefaultTags
                },
            ]
        } else {
            this.valueStructure = [
                {
                    label: 'Tags',
                    value: this.tagsValueID,
                    items: DefaultWorkCellTags
                },
                {
                    label: 'KPIs',
                    value: this.KPIValueID,
                    items: DefaultKPIs
                },
                {
                    label: 'Tables',
                    value: 'table',
                    items: DefaultTables,
                }
            ]
        }

        return this.valueStructure;

    }

    onObjectChange = (val: string) => {

        // split object into enterprise, area, production line, work cell
        const {onChange, query} = this.props;
        const fullTagName = val;
        const enterprise = fullTagName.split('/')[0];
        const site = fullTagName.split('/')[1];
        const area = fullTagName.split('/')[2];
        const productionLine = fullTagName.split('/')[3];
        const workCell = fullTagName.split('/')[4];

        onChange({...query, enterprise, site, area, productionLine, workCell, fullTagName});

        // and also in QueryEditor
        this.selectedObject = val;

        // reset value and configuration
        this.selectedValue = '';
        this.selectedConfigurationGapfilling = this.defaultConfigurationGapfilling;

        // force render
        this.forceUpdate();
    }

    onValueChange = (val: string) => {

        const {onChange, query} = this.props;
        const value = val;
        onChange({...query, value});

        // and also in QueryEditor
        this.selectedValue = val;

        // reset configuration
        this.selectedConfigurationGapfilling = this.defaultConfigurationGapfilling;

        // force render
        this.forceUpdate();

    }

    onConfigurationGapfillingChange = (value: SelectableValue) => {
        const {onChange, query} = this.props;
        const configurationTagGapfilling = value.value;
        onChange({...query, configurationTagGapfilling});

        // and also in QueryEditor
        this.selectedConfigurationGapfilling = value;

        // force render
        this.forceUpdate();
    }

    onConfigurationAggregatesChange = (value: Array<SelectableValue>) => {
        const {onChange, query} = this.props;
        const configurationTagAggregates = value.map(v => v.value);
        onChange({...query, configurationTagAggregates});

        // and also in QueryEditor
        this.selectedConfigurationAggregates = value;

        // force render
        this.forceUpdate();
    }

    onConfigurationTimeBucketChange = (value: SelectableValue) => {
        const {onChange, query} = this.props;
        const configurationTimeBucket = value.value;
        onChange({...query, configurationTimeBucket});

        // and also in QueryEditor
        this.selectedConfigurationTimeBucket = value.value;

        // force render
        this.forceUpdate();
    }



    render() {


        return (
            <div>
                <FieldSet
                >
                    <div className="gf-form">
                        <InlineLabel
                            width={10}
                            tooltip={'Select an enterprise, site, area, production line, or work cell'}
                        >
                            Object
                        </InlineLabel>
                        <Cascader
                            options={this.getObjectStructure()}
                            onSelect={this.onObjectChange}
                            value={this.selectedObject}
                            displayAllSelectedLevels={true}
                            width={60}
                        />
                    </div>
                    <div
                        className="gf-form"
                        hidden={!this.isObjectSelected()}
                    >
                        <InlineLabel
                            width={10}
                            tooltip={'Select an automatic calculated KPI or a tag for the selected object'}
                        >
                            Value
                        </InlineLabel>
                        <Cascader
                            options={this.getValueStructure()}
                            onSelect={this.onValueChange}
                            displayAllSelectedLevels={true}
                            value={this.selectedValue}
                            width={60}
                        />
                    </div>

                    <Alert
                        title="Please select a value from the dropdown menu"
                        severity="error"
                        hidden={this.isValidValueSelected() || !this.isObjectSelected()}
                    >
                        "Tags" or "KPIs" are not valid values for the "Element" field.
                    </Alert>
                </FieldSet>
                <FieldSet
                    hidden={!this.isCurrentSelectedValueACustomTag()}
                    // Configure the tag. If you are unsure, leave the defaults
                >
                    <div className={'gf-form'}>
                        <InlineLabel
                            width={"auto"}
                            tooltip={'Common statistical aggregates'}
                        >
                            Aggregates
                        </InlineLabel>
                        <MultiSelect
                            options={this.tagAggregatesOptions}
                            width={30}
                            defaultValue={this.defaultConfigurationAggregates}
                            value={this.selectedConfigurationAggregates}
                            onChange={this.onConfigurationAggregatesChange}
                        />
                    </div>
                    <div className={'gf-form'}>
                        <InlineLabel
                            width={"auto"}
                            tooltip={'A time interval for how long each bucket is'}
                        >
                            Time Bucket
                        </InlineLabel>
                        <Input
                            width={30}
                            defaultValue={"auto"}
                            value={this.selectedConfigurationTimeBucket}
                            onChange={this.onConfigurationTimeBucketChange}
                        />
                    </div>
                    <div className={'gf-form'}>
                        <InlineLabel
                            width={"auto"}
                            tooltip={'How missing data should be filled. For more information, please visit our documentation.'}
                        >
                            Handling missing values
                        </InlineLabel>
                        <Select
                            options={this.tagGapfillingOptions}
                            width={30}
                            defaultValue={this.tagGapfillingOptions[0]}
                            value={this.selectedConfigurationGapfilling}
                            onChange={this.onConfigurationGapfillingChange}
                        />
                    </div>
                </FieldSet>
            </div>)
    }
}
