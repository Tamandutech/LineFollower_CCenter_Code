import { it, expect, describe } from 'vitest';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import BatteryWarningCard from 'src/components/cards/BatteryWarningCard.vue';

installQuasarPlugin();

describe('BatteryWarningCard', () => {
  it('should render without errors', () => {
    const wrapper = mount(BatteryWarningCard, {
      props: {
        currentVoltage: 0,
      },
    });
    expect(wrapper).toBeTruthy();
  });

  it('should display the correct voltage in a card section', () => {
    const wrapper = mount(BatteryWarningCard, {
      props: {
        currentVoltage: 0,
      },
    });
    expect(wrapper.findAll('.q-card__section')[1].text()).toContain('0');
  });
});
