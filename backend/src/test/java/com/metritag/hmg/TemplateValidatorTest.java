package com.metritag.hmg;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static com.metritag.hmg.TemplateSchema.*;

class TemplateValidatorTest {
    TemplateValidator validator=new TemplateValidator();
    TemplateSchema schema(Field field) { return new TemplateSchema("T","1","Parameters",TaskTree.Kind.VEHICLE,null,List.of(field)); }
    @Test void numericZeroIsAValueAndWrongTypesAreRejected() {
        var schema=schema(new Field("n","Number",Format.NUMBER,true,BigDecimal.ZERO,BigDecimal.TEN,null,null));
        assertThatCode(()->validator.validate(schema,Map.of("n",0),true)).doesNotThrowAnyException();
        assertThatThrownBy(()->validator.validate(schema,Map.of("n","0"),true)).isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(()->validator.validate(schema,Map.of("n",List.of()),true)).isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(()->validator.validate(schema,Map.of("n",11),true)).isInstanceOf(FieldValidationException.class);
        assertThatCode(()->validator.validate(schema,Map.of(),false)).doesNotThrowAnyException();
        assertThatThrownBy(()->validator.validate(schema,Map.of(),true)).isInstanceOf(FieldValidationException.class);
    }
    @Test void tableChecksRequiredCellsAndUnknownColumns() {
        var schema=schema(new Field("table","Parameters",Format.TABLE,true,null,null,null,List.of(new Column("mass","Mass",Format.NUMBER,true))));
        assertThatCode(()->validator.validate(schema,Map.of("table",List.of(Map.of("mass",0))),true)).doesNotThrowAnyException();
        assertThatThrownBy(()->validator.validate(schema,Map.of("table",List.of(Map.of())),true)).isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(()->validator.validate(schema,Map.of("table",List.of(Map.of("other",1))),false)).isInstanceOf(FieldValidationException.class);
    }
    @Test void orderedAndTextConstraintsAreChecked() {
        assertThatThrownBy(()->validator.validate(schema(new Field("n","Order",Format.ORDERED,true,null,null,null,null)),Map.of("n",1.5),true)).isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(()->validator.validate(schema(new Field("text","Text",Format.TEXT,true,null,null,2,null)),Map.of("text","long"),false)).isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(()->validator.validate(schema(new Field("rich","Rich",Format.RICH,true,null,null,null,null)),Map.of("rich","<p>&nbsp;</p>"),true)).isInstanceOf(FieldValidationException.class);
    }
    @Test void schemaRejectsDuplicateFieldsAndInvalidBounds() {
        var field=new Field("same","Number",Format.NUMBER,true,BigDecimal.TEN,BigDecimal.ZERO,null,null);
        assertThatThrownBy(()->schema(field).checkDefinition()).isInstanceOf(BusinessException.class);
        var text=new Field("same","Text",Format.TEXT,false,null,null,null,null);
        var duplicate=new TemplateSchema("T","1","Parameters",TaskTree.Kind.VEHICLE,null,List.of(text,text));
        assertThatThrownBy(duplicate::checkDefinition).isInstanceOf(BusinessException.class);
    }
}
