/// <reference types='cypress' />
/// <reference types="../../support" />

import AppFrontend from '../../pageobjects/app-frontend';
import { Likert } from '../../pageobjects/likert';

const appFrontend = new AppFrontend();
const likertPage = new Likert();

describe('Likert', () => {
  it('Should show validation message for required likert', () => {
    cy.navigateToTask4();
    cy.get(appFrontend.sendinButton).click();
    cy.findAllByRole('alert').should(($alerts) => {
      expect($alerts).to.have.length(3);
      expect($alerts.eq(0).text()).to.match(new RegExp('du må fylle ut ' + likertPage.requiredQuestions[0], 'i'));
      expect($alerts.eq(1).text()).to.match(new RegExp('du må fylle ut ' + likertPage.requiredQuestions[1], 'i'));
      expect($alerts.eq(2).text()).to.match(new RegExp('du må fylle ut ' + likertPage.requiredQuestions[2], 'i'));
    });
  });
  it('Should fill out optional likert and see results in summary component', () => {
    cy.navigateToTask4();
    likertPage.assertOptionalLikertColumnHeaders();
    likertPage.selectRadio(likertPage.optionalQuestions[0], likertPage.options[2]);
    likertPage.selectRadio(likertPage.optionalQuestions[1], likertPage.options[1]);
    likertPage.selectRadio(likertPage.optionalQuestions[2], likertPage.options[1]);
    cy.get('[data-testid=summary-component]').should(($summary) => {
      const text = $summary.text();
      expect(text).to.contain(likertPage.optionalTableTitle);
      expect(text).to.contain(likertPage.optionalQuestions[0] + ' : ' + likertPage.options[2]);
      expect(text).to.contain(likertPage.optionalQuestions[1] + ' : ' + likertPage.options[1]);
      expect(text).to.contain(likertPage.optionalQuestions[2] + ' : ' + likertPage.options[1]);
    });
  });
});
