import type { Schema, Struct } from '@strapi/strapi';

export interface ButtonCtaButton extends Struct.ComponentSchema {
  collectionName: 'components_button_cta_buttons';
  info: {
    displayName: 'Cta_button';
  };
  attributes: {
    Text: Schema.Attribute.String;
    Url: Schema.Attribute.String;
  };
}

export interface ButtonNavButton extends Struct.ComponentSchema {
  collectionName: 'components_button_nav_buttons';
  info: {
    displayName: 'Nav_button';
  };
  attributes: {
    Text: Schema.Attribute.String;
    Url: Schema.Attribute.String;
  };
}

export interface ButtonNavigationButtons extends Struct.ComponentSchema {
  collectionName: 'components_button_navigation_buttons';
  info: {
    displayName: 'navigationButtons';
  };
  attributes: {
    navigationText: Schema.Attribute.String;
    path: Schema.Attribute.String;
  };
}

export interface ButtonSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_button_social_links';
  info: {
    displayName: 'Social_Link';
  };
  attributes: {
    Social_Link_Name: Schema.Attribute.String;
    Social_Logo: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    Url: Schema.Attribute.String;
  };
}

export interface ButtonTermsAndServices extends Struct.ComponentSchema {
  collectionName: 'components_button_terms_and_services';
  info: {
    displayName: 'Terms_and_Services';
  };
  attributes: {
    path: Schema.Attribute.String;
    text: Schema.Attribute.String;
  };
}

export interface CardStackedCard extends Struct.ComponentSchema {
  collectionName: 'components_card_stacked_cards';
  info: {
    displayName: 'StackedCard';
  };
  attributes: {
    CardTitle: Schema.Attribute.String;
    Descriptions: Schema.Attribute.String;
  };
}

export interface CardTourHighlight extends Struct.ComponentSchema {
  collectionName: 'components_card_tour_highlights';
  info: {
    displayName: 'TourHighlight';
  };
  attributes: {
    Highlight_Icon: Schema.Attribute.Media<'images'>;
    Highlight_Text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MembersDirector extends Struct.ComponentSchema {
  collectionName: 'components_members_directors';
  info: {
    displayName: 'Director';
  };
  attributes: {
    Director_Descriptions: Schema.Attribute.Text;
    Director_Email: Schema.Attribute.Email;
    Director_Image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    Director_Name: Schema.Attribute.String;
    Director_Position: Schema.Attribute.String;
  };
}

export interface MembersExpert extends Struct.ComponentSchema {
  collectionName: 'components_members_experts';
  info: {
    displayName: 'Expert';
  };
  attributes: {
    Expert_descriptions: Schema.Attribute.Text;
    Expert_email: Schema.Attribute.Email;
    Expert_image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    Expert_name: Schema.Attribute.String;
    Expert_position: Schema.Attribute.String;
  };
}

export interface MembersLeader extends Struct.ComponentSchema {
  collectionName: 'components_members_leaders';
  info: {
    displayName: 'Leader';
  };
  attributes: {
    Leader_descriptions: Schema.Attribute.Text;
    Leader_email: Schema.Attribute.Email;
    Leader_image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    Leader_name: Schema.Attribute.String;
    Leader_postition: Schema.Attribute.String;
  };
}

export interface MenuItemContactItem extends Struct.ComponentSchema {
  collectionName: 'components_menu_item_contact_items';
  info: {
    displayName: 'Contact_Item';
  };
  attributes: {
    label: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface MenuItemFooterMenu1Item extends Struct.ComponentSchema {
  collectionName: 'components_menu_item_footer_menu1_items';
  info: {
    displayName: 'Footer_Menu1_Item';
  };
  attributes: {
    path: Schema.Attribute.String;
    text: Schema.Attribute.String;
  };
}

export interface MenuItemFooterMenu2Item extends Struct.ComponentSchema {
  collectionName: 'components_menu_item_footer_menu2_items';
  info: {
    displayName: 'Footer_Menu2_Item';
  };
  attributes: {
    path: Schema.Attribute.String;
    text: Schema.Attribute.String;
  };
}

export interface SlidesPartner extends Struct.ComponentSchema {
  collectionName: 'components_slides_partners';
  info: {
    displayName: 'Partner';
  };
  attributes: {
    Description: Schema.Attribute.String;
    PartnerLogo: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    PartnerName: Schema.Attribute.String;
  };
}

export interface SlidesQuestion extends Struct.ComponentSchema {
  collectionName: 'components_slides_questions';
  info: {
    displayName: 'Question';
  };
  attributes: {
    Answer: Schema.Attribute.Blocks;
    Question: Schema.Attribute.String;
  };
}

export interface SlidesSlide extends Struct.ComponentSchema {
  collectionName: 'components_slides_slides';
  info: {
    displayName: 'Slide';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    buttonPath: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    navTextLine1: Schema.Attribute.String;
    navTextLine2: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface SlidesStatisticSlide extends Struct.ComponentSchema {
  collectionName: 'components_slides_statistic_slides';
  info: {
    displayName: 'StatisticSlide';
  };
  attributes: {
    line1: Schema.Attribute.String;
    line2: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface SlidesTimelineEvents extends Struct.ComponentSchema {
  collectionName: 'components_slides_timeline_events';
  info: {
    displayName: 'TimelineEvents';
  };
  attributes: {
    cardDescription: Schema.Attribute.Text;
    cardTitle: Schema.Attribute.String;
    date: Schema.Attribute.String;
  };
}

export interface SlidesYear extends Struct.ComponentSchema {
  collectionName: 'components_slides_years';
  info: {
    displayName: 'Year';
  };
  attributes: {
    Description: Schema.Attribute.Blocks;
    Image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    Title: Schema.Attribute.String;
    Year: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'button.cta-button': ButtonCtaButton;
      'button.nav-button': ButtonNavButton;
      'button.navigation-buttons': ButtonNavigationButtons;
      'button.social-link': ButtonSocialLink;
      'button.terms-and-services': ButtonTermsAndServices;
      'card.stacked-card': CardStackedCard;
      'card.tour-highlight': CardTourHighlight;
      'members.director': MembersDirector;
      'members.expert': MembersExpert;
      'members.leader': MembersLeader;
      'menu-item.contact-item': MenuItemContactItem;
      'menu-item.footer-menu1-item': MenuItemFooterMenu1Item;
      'menu-item.footer-menu2-item': MenuItemFooterMenu2Item;
      'slides.partner': SlidesPartner;
      'slides.question': SlidesQuestion;
      'slides.slide': SlidesSlide;
      'slides.statistic-slide': SlidesStatisticSlide;
      'slides.timeline-events': SlidesTimelineEvents;
      'slides.year': SlidesYear;
    }
  }
}
