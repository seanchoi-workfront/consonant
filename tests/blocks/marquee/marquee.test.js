/* eslint-disable no-unused-expressions */
/* global describe it */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import init from '../../../blocks/marquee/marquee.js';
import { cleanVariations } from '../../../scripts/scripts.js';

const mock = await readFile({ path: './marquee.mock.html' });
document.body.innerHTML = mock;
cleanVariations(document.body);

describe('marquee', () => {
  const marquees = document.querySelectorAll('.marquee');
  marquees.forEach((marquee) => {
    init(marquee);
  });
  describe('default marquee', () => {
    it('has a heading', () => {
      const heading = marquees[0].querySelector('.heading-XL');
      expect(heading).to.exist;
    });

    it('has a background image', () => {
      const image = marquees[0].querySelector('.image');
      expect(image).to.exist;
    });

    it('doesnt have detail', () => {
      const detail = marquees[0].querySelector('.detail-M');
      expect(detail).to.not.exist;
    });

    it('has content on the correct side', () => {
      const sides = marquees[0].querySelectorAll('.foreground > div');
      expect(sides[0].className).to.equal('text');
      expect(sides[1].className).to.equal('image');
    });
  });

  describe('right align marquee', () => {
    it('has content on the correct side', () => {
      const sides = marquees[1].querySelectorAll('.foreground > div');
      expect(sides[0].className).to.equal('image');
      expect(sides[1].className).to.equal('text');
    });
  });

  describe('marquee with detail', () => {
    it('has detail', () => {
      const detail = marquees[2].querySelectorAll('.detail-M');
      expect(detail).to.exist;
    });
  });
});
