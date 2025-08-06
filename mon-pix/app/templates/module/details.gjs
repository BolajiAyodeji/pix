import Footer from 'mon-pix/components/footer/index';
import Details from 'mon-pix/components/module/instruction/details';
import BetaBanner from 'mon-pix/components/module/layout/beta-banner';
<template>
  {{#if @model.isBeta}}
    <div class="modulix-beta-banner">
      <BetaBanner />
    </div>
  {{/if}}
  <div class="modulix">
    <Details @module={{@model}} />
  </div>
  <Footer />
</template>
