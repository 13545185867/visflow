/**
 * Provides wrapper to address the limitation of vue-select^2.4.0 while waiting for its updates.
 */
import vSelect from 'vue-select';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import _ from 'lodash';

@Component({
  components: {
    vSelect,
  },
})
export default class VueSelect extends Vue {
  @Prop()
  private options!: SelectOption[];

  @Prop({ default: true })
  private clearable!: boolean;

  @Prop({ default: true })
  private emitValue!: boolean;

  @Prop({ default: false })
  private multiple!: boolean;

  // Property binded with v-select
  private childSelected: SelectOption | SelectOption[] | null = null;

  // Property binded with parent element
  @Prop({ type: [Object, Number, String, Array] })
  private value!: string | number | Array<string | number> | null;

  private selected: string | number | Array<string | number> | null = null;

  private created() {
    // Pass initial value assignment to child select, without emitting input event.
    this.updateSelectedFromValue();
  }

  private updateSelectedFromValue() {
    this.selected = this.value;
    this.childSelected = this.childSelectedOption();
  }

  @Watch('value')
  private onValueChange() {
    if (!_.isEqual(this.selected, this.value)) {
      this.updateSelectedFromValue();
      this.$emit('input', this.selected);
    }
  }

  private getValue(option: SelectOption): number | string {
    if (option instanceof Object) {
      return (option as SelectOptionObject).value;
    }
    return option;
  }

  private childSelectedOption(): SelectOption | SelectOption[] {
    if (this.selected instanceof Array) {
      return this.selected.map(value => {
        return _.find(this.options, opt => this.getValue(opt) === value) as SelectOption;
      });
    } else {
      return _.find(this.options, opt => this.getValue(opt) === this.selected) as SelectOption;
    }
  }

  /**
   * Handles item selection from the child <v-select>
   */
  private onListSelect(option: SelectOption | SelectOption[]) {
    if (option === null && !this.clearable) {
      // Set it back to the original value.
      // Must use next tick otherwise this happens before child clears the chosen UI option.
      this.$nextTick(() => this.childSelected = this.childSelectedOption());
      return;
    }
    let newSelected: string | number | Array<string | number> | null;
    if (option instanceof Array) {
      newSelected = (this.childSelected as SelectOption[]).map(opt => this.getValue(opt));
    } else {
      newSelected = this.getValue(this.childSelected as SelectOption);
    }
    if (!_.isEqual(this.selected, newSelected)) {
      this.selected = newSelected;
      this.$emit('input', this.selected);
    }
  }
}
